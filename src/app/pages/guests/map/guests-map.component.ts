import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

// Services
import { MapService } from '@services/map.service';
import { LanguageService } from '@core/services/language.service';
import { GeonameService } from '@services/geoname.service';

// Interfaces
import { IGuestTableMember, IGuestTableRow } from '@interfaces/data-structure-api';
import { IAdminRegionsGeoJson, IWorldGeoJson } from '@interfaces/map-interface';
import { REGION_NAMES } from '@config/world/regions';

// Country data
import { WORLD } from '@config/world';

// Types
import { Continents, ICountry } from '@type/word.types';

// Libraries
import * as L from 'leaflet';
import { featureCollection, union, area, bbox, booleanPointInPolygon, feature, point } from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

@Component({
  providers: [MapService],
  selector: 'guests-map',
  templateUrl: './guests-map.component.html',
  styleUrls: ['./guests-map.component.css'],
})
export class GuestsMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: IGuestTableRow[] = [];

  private selectedCountryIso3 = '';

  // Each marker corresponds to a specific guest
  private guestMarkerPeople = new Map<L.Marker, IGuestTableMember>();

  private readonly _map = inject(MapService);
  private readonly _language = inject(LanguageService);
  private readonly _translate = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _geoname = inject(GeonameService);

  private languageSubscription?: Subscription;

  private mapContainer?: HTMLDivElement;
  private geoJsonData?: IWorldGeoJson;

  private map?: L.Map;
  private geoLayer?: L.GeoJSON;
  private guestMarkersLayer?: L.LayerGroup;

  private activePopup?:
    | {
        type: 'country';
        layer: L.Layer;
        country: ICountry;
        count: number;
        iso3: string;
      }
    | {
        type: 'admin-region';
        layer: L.Layer;
        code: string;
        count: number;
      };

  private tileLayer?: L.TileLayer;
  private themeObserver?: MutationObserver;
  private isDarkMap?: boolean;

  // Regions GeoJson
  private adminRegionsGeoJsonData?: IAdminRegionsGeoJson;
  private adminRegionsLayer?: L.GeoJSON;
  private readonly ukRegionCodes = ['sct', 'wls', 'eng', 'nir'];

  private resizeObserver?: ResizeObserver;

  private guestCounts: Record<string, number> = {};

  // ISO
  private readonly countriesByIso3: Record<string, ICountry> = {};
  private readonly countriesByIso2: Record<string, ICountry> = {};
  private readonly countriesByName: Record<string, ICountry> = {};

  // It saves us from having to call Object.entries(WORLD).find(...) every time.
  private readonly iso3ByCountry = new Map<ICountry, string>();

  private topGuestCountryIso3 = '';
  private guestIdsByCountry: Record<string, string[]> = {};

  @ViewChild('mapCtn')
  set mapCtn(element: ElementRef<HTMLDivElement> | undefined) {
    if (!element) return;
    this.mapContainer = element.nativeElement;

    this.tryInitMap();
  }

  // LIFECYCLE
  ngOnInit(): void {
    this.buildCountryLookups();
    this.guestCounts = this.getGuestCounts();

    this.watchLanguageChanges();

    this.getWorldMap();
    this.getAdminRegionsMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['data'] || changes['data'].firstChange) {
      return;
    }
    this.guestCounts = this.getGuestCounts();
    this.updateCountryStyles();
    this.updateGuestMarkers();
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
    this.languageSubscription = undefined;

    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    this.themeObserver?.disconnect();
    this.themeObserver = undefined;

    this.map?.remove();

    this.map = undefined;
    this.geoLayer = undefined;
    this.tileLayer = undefined;
    this.geoJsonData = undefined;
    this.adminRegionsGeoJsonData = undefined;
    this.adminRegionsLayer = undefined;
    this.mapContainer = undefined;

    this.guestMarkersLayer?.clearLayers();
    this.guestMarkersLayer = undefined;
    this.guestMarkerPeople.clear();
  }

  getContinentName(continent: Continents): string {
    return this._geoname.getContinentName(continent);
  }

  private watchLanguageChanges(): void {
    this.languageSubscription = this._translate.onLangChange.subscribe(() => {
      this.updateTooltipsLanguage();
      this.updateGuestMarkerPopupsLanguage();

      const active = this.activePopup;
      if (!active) return;

      const popup = active.layer.getPopup();

      // Do not update a popup that has already been closed.
      if (!popup?.isOpen()) return;

      let html: string;

      if (active.type === 'country') {
        // Rebuild the country popup using the new language.
        html = this.getCountryPopupHtml(active.country, active.count, active.iso3);
      } else {
        // Rebuild the UK region popup using the new language.
        const regionName = this._translate.instant(`UK_REGIONS.${active.code.toLowerCase()}`);
        html = this.getAdminRegionPopupHtml(regionName, active.code, active.count);
      }

      // Replace the content of the popup that is already open.
      popup.setContent(html);
      popup.update();
      // The country popup contains a dynamically generated navigation link.
      if (active.type === 'country') {
        this.bindCountryPopupButton(popup, active.count);
      }
    });
  }
  private updateGuestMarkerPopupsLanguage(): void {
    this.guestMarkerPeople.forEach((person, marker) => {
      const popup = marker.getPopup();

      if (!popup) return;

      // Rebuild the guest popup using the current language.
      popup.setContent(this.createGuestPopup(person));

      if (popup.isOpen()) {
        popup.update();
      }
    });
  }

  private updateTooltipsLanguage(): void {
    // COUNTRIES
    this.geoLayer?.eachLayer((layer: L.Layer) => {
      const feature = (layer as any).feature;
      if (!feature) return;
      const config = this.getCountryConfig(feature);
      const country = config.country;

      const countryName =
        country?.name[this._language.currentLanguage] ??
        country?.name.en ??
        feature.properties?.ADMIN ??
        feature.properties?.name ??
        this._translate.instant('MAP.UNKNOWN_COUNTRY');

      layer.unbindTooltip();

      layer.bindTooltip(`<strong>${countryName}</strong>`, {
        sticky: true,
        direction: 'top',
        opacity: 1,
        className: 'country-hover-tooltip',
      });
    });

    // UK ADMINISTRATIVE REGIONS
    this.adminRegionsLayer?.eachLayer((layer: L.Layer) => {
      const feature = (layer as any).feature;
      const code = feature?.properties?.gu_a3?.toLowerCase();

      if (!code) return;
      const regionName = this._translate.instant(`UK_REGIONS.${code}`);

      layer.unbindTooltip();

      layer.bindTooltip(`<strong>${regionName}</strong>`, {
        sticky: true,
        direction: 'top',
        opacity: 1,
        className: 'country-hover-tooltip',
      });
    });
  }

  // COUNTRY LOOKUPS
  private buildCountryLookups(): void {
    Object.entries(WORLD).forEach(([iso3, country]) => {
      const normalizedIso3 = iso3.toLowerCase().trim();

      this.countriesByIso3[normalizedIso3] = country;
      this.iso3ByCountry.set(country, normalizedIso3);

      // ISO2
      if (country.flag) {
        this.countriesByIso2[country.flag.toLowerCase().trim()] = country;
      }
      if (country.name) {
        this.countriesByName[this.normalizeCountryName(country.name.en)] = country;
      }
    });
  }

  private normalizeCountryName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // COUNTRY CONFIG
  private getCountryConfig(feature: any): {
    iso3: string;
    country?: ICountry;
  } {
    const properties = feature?.properties ?? {};

    // ISO3
    const iso3Candidates = [properties['ISO3166-1-Alpha-3'], properties.ISO_A3, properties.ISO_A3_EH, properties.ADM0_A3, properties.WB_A3, properties.ISO3, feature?.id];

    for (const value of iso3Candidates) {
      if (!value) continue;

      const code = String(value).toLowerCase().trim();

      if (code === '-99' || code === 'null' || code === 'undefined' || code.length !== 3) continue;

      const country = this.countriesByIso3[code];

      if (country) {
        return {
          iso3: code,
          country,
        };
      }
    }

    // ISO2
    const iso2Candidates = [properties.ISO_A2, properties.ISO_A2_EH, properties.ISO2, properties['ISO3166-1-Alpha-2']];

    for (const value of iso2Candidates) {
      if (!value) continue;
      const code = String(value).toLowerCase().trim();

      if (code === '-99' || code === 'null' || code === 'undefined' || code.length !== 2) continue;

      const country = this.countriesByIso2[code];

      if (country) {
        return {
          iso3: this.iso3ByCountry.get(country) ?? '',
          country,
        };
      }
    }

    // NAME
    const nameCandidates = [properties.name, properties.ADMIN, properties.NAME_EN, properties.NAME, properties.name_en, properties.admin];

    for (const value of nameCandidates) {
      if (!value) {
        continue;
      }
      const normalizedName = this.normalizeCountryName(String(value));
      const country = this.countriesByName[normalizedName];

      if (country) {
        return {
          iso3: this.iso3ByCountry.get(country) ?? '',
          country,
        };
      }
    }

    // ALIASES
    const aliases: Record<string, string> = {
      france: 'fra',
      norway: 'nor',
      spain: 'esp',
      germany: 'deu',
      italy: 'ita',
      'united kingdom': 'gbr',
      uk: 'gbr',
      britain: 'gbr',
      'united states': 'usa',
      'united states of america': 'usa',
      'south korea': 'kor',
      'republic of korea': 'kor',
      'north korea': 'prk',
      russia: 'rus',
      'czech republic': 'cze',
      czechia: 'cze',
      turkey: 'tur',
      turkiye: 'tur',
      bolivia: 'bol',
      venezuela: 'ven',
      colombia: 'col',
      peru: 'per',
      ecuador: 'ecu',
      brazil: 'bra',
      argentina: 'arg',
      chile: 'chl',
      paraguay: 'pry',
      uruguay: 'ury',
      guyana: 'guy',
      suriname: 'sur',
      'south africa': 'zaf',
      'democratic republic of the congo': 'cod',
      'republic of the congo': 'cog',
      'ivory coast': 'civ',
      'cote divoire': 'civ',
      'cape verde': 'cpv',
      'sao tome and principe': 'stp',
      swaziland: 'swz',
      'myanmar (burma)': 'mmr',
      burma: 'mmr',
      laos: 'lao',
      'east timor': 'tls',
      'timor leste': 'tls',
    };

    for (const value of nameCandidates) {
      if (!value) {
        continue;
      }
      const normalizedName = this.normalizeCountryName(String(value));
      const alias = aliases[normalizedName];

      if (alias && this.countriesByIso3[alias]) {
        return {
          iso3: alias,
          country: this.countriesByIso3[alias],
        };
      }
    }
    return {
      iso3: '',
      country: undefined,
    };
  }

  // GET FEATURE CODE
  private getFeatureCode(feature: any): string {
    return this.getCountryConfig(feature).iso3;
  }

  // WORLD MAP
  private getWorldMap(): void {
    this._map.getWorldMap().subscribe({
      next: geoJson => {
        this.geoJsonData = geoJson;
        this.tryInitMap();
      },
      error: error => {
        console.error('Error loading world GeoJSON:', error);
      },
    });
  }

  // MAP INITIALIZATION
  private tryInitMap(): void {
    if (!this.mapContainer || !this.geoJsonData || this.map) {
      return;
    }
    this.map = L.map(this.mapContainer, {
      preferCanvas: true,
      worldCopyJump: false,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      minZoom: 1,
      maxZoom: 18,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    this.guestMarkersLayer = L.layerGroup().addTo(this.map);

    this.updateMapTheme();
    this.watchThemeChanges();

    // GUEST COUNTS
    this.guestCounts = this.getGuestCounts();

    // GEOJSON
    this.createGeoLayer();
    this.createAdminRegionsLayer();

    // RESIZE OBSERVER
    this.setupResizeObserver();

    // INVALIDATE SIZE
    requestAnimationFrame(() => {
      this.map?.invalidateSize({ animate: false });
    });

    setTimeout(() => {
      this.map?.invalidateSize({ animate: false });
    }, 100);
    this.updateGuestMarkers();
  }

  // RESIZE OBSERVER
  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize({ animate: false });
    });

    this.resizeObserver.observe(this.mapContainer);
  }

  // GEOJSON
  private createGeoLayer(): void {
    if (!this.map || !this.geoJsonData) {
      return;
    }
    this.geoLayer = L.geoJSON(this.geoJsonData as any, {
      style: (feature: any): L.PathOptions => {
        return this.getCountryStyle(feature);
      },
      onEachFeature: (feature: any, layer: L.Layer): void => {
        this.setupCountryInteraction(feature, layer);
      },
    }).addTo(this.map);

    // POSITION
    this.map.setView([25, 0], 2);
    requestAnimationFrame(() => {
      this.map?.invalidateSize({ animate: false });
    });

    // INITIAL POSITION
    // We don't use fitBounds() because some global GeoJSON files may contain geometries that cause bounds to be excessively large or unusual.
    // This position is much more stable.
    this.map.setView([28, 0], 2);
    requestAnimationFrame(() => {
      this.map?.invalidateSize({
        animate: false,
      });
    });
  }

  // COUNTRY STYLE
  private getCountryStyle(feature: any): L.PathOptions {
    const iso = this.getFeatureCode(feature);
    const count = iso ? (this.guestCounts[iso] ?? 0) : 0;
    const borderColor = this.getMapColor('--map-country-border', '#ffffff');

    // Highlight the selected country.
    if (this.selectedCountryIso3 && iso === this.selectedCountryIso3) {
      return {
        color: this.getMapColor('--color-primary', '#2457a7'),
        weight: 2,
        opacity: 1,
        fillColor: this.getMapColor('--color-accent', '#e5bd63'),
        fillOpacity: 0.95,
        interactive: true,
      };
    }

    // Highlight the country with the most guests.
    if (iso === this.topGuestCountryIso3 && count > 0) {
      return {
        color: borderColor,
        weight: 1.5,
        opacity: 1,
        fillColor: this.getMapColor('--map-country-winner', '#f59e0b'),
        fillOpacity: 0.95,
        interactive: true,
      };
    }
    if (count === 0) {
      return {
        color: borderColor,
        weight: 0.7,
        opacity: 0.8,
        fillColor: this.getMapColor('--map-country-empty', '#e5e7eb'),
        fillOpacity: 0.55,
        interactive: true,
      };
    }

    return {
      color: borderColor,
      weight: 0.7,
      opacity: 1,
      fillColor: this.getCountryColor(count),
      fillOpacity: 0.85,
      interactive: true,
    };
  }

  // COUNTRY COLOR
  private getCountryColor(count: number): string {
    if (count < 3) {
      return this.getMapColor('--map-country-low', '#b3c9e8');
    }

    if (count < 5) {
      return this.getMapColor('--map-country-medium', '#729bd1');
    }

    return this.getMapColor('--map-country-high', '#3265a8');
  }

  // UPDATE COLORS
  private updateCountryStyles(): void {
    // Countries
    if (this.geoLayer) {
      this.geoLayer.eachLayer((layer: L.Layer) => {
        const feature = (layer as any).feature;

        if (!feature) return;

        const style = this.getCountryStyle(feature);

        if (layer instanceof L.Path) {
          layer.setStyle(style);
        }
      });
    }

    // UK regions
    if (this.adminRegionsLayer) {
      this.adminRegionsLayer.eachLayer((layer: L.Layer) => {
        const feature = (layer as any).feature;
        if (!feature) {
          return;
        }
        const code = feature.properties?.gu_a3?.toLowerCase();
        if (!code) {
          return;
        }

        const count = this.guestCounts[code] ?? 0;
        const isWinningCountry = this.topGuestCountryIso3 === 'gbr' && (this.guestCounts['gbr'] ?? 0) > 0;

        if (layer instanceof L.Path) {
          layer.setStyle({
            color: this.getMapColor('--map-country-border', '#ffffff'),
            weight: isWinningCountry ? 1.5 : 0.7,
            opacity: 1,
            fillColor: isWinningCountry
              ? this.getMapColor('--map-country-winner', '#f59e0b')
              : count > 0
                ? this.getCountryColor(count)
                : this.getMapColor('--map-country-empty', '#e5e7eb'),
            fillOpacity: isWinningCountry ? 0.95 : count > 0 ? 0.85 : 0.55,
          });
        }
      });
    }
  }

  // COUNTRY INTERACTION
  private setupCountryInteraction(feature: any, layer: L.Layer): void {
    const config = this.getCountryConfig(feature);
    const country = config.country;
    const countryName =
      country?.name[this._language.currentLanguage] ??
      country?.name.en ??
      feature?.properties?.name ??
      feature?.properties?.ADMIN ??
      feature?.properties?.NAME_EN ??
      feature?.properties?.NAME ??
      this._translate.instant('MAP.UNKNOWN_COUNTRY');

    const iso3 = config.iso3;

    // TOOLTIP
    layer.bindTooltip(`<strong>${countryName}</strong>`, {
      sticky: true,
      direction: 'top',
      opacity: 1,
      className: 'country-hover-tooltip',
    });

    // MOUSE EVENTS
    layer.on({
      mouseover: (event: any) => {
        const target = event.target;

        target.setStyle({
          weight: 1.5,
          color: this.getMapColor('--color-text', '#000000'),
          fillColor: this.getMapColor('--color-hover-country', '#590000'),
        });

        target.bringToFront();
      },

      mouseout: (event: any) => {
        if (!this.geoLayer) return;
        this.geoLayer.resetStyle(event.target);
      },
    });

    // CLICK
    layer.on('click', () => {
      const currentCount = iso3 ? (this.guestCounts[iso3] ?? 0) : 0;
      // Only countries with guests can be selected.
      if (currentCount === 0 || !country || !iso3) return;

      this.selectedCountryIso3 = iso3;
      this.updateCountryStyles();
      this.showCountryPopup(layer, country, currentCount, iso3);
    });
  }

  // COUNTRY POPUP
  private showCountryPopup(layer: L.Layer, country: ICountry, count: number, iso3: string): void {
    this.activePopup = {
      type: 'country',
      layer,
      country,
      count,
      iso3,
    };

    const html = this.getCountryPopupHtml(country, count, iso3);

    layer.bindPopup(html, {
      closeButton: true,
      autoClose: true,
      closeOnClick: true,
      className: 'country-popup-container',
      maxWidth: 280,
    });

    // Remove the selected country highlight when its popup closes.
    layer.once('popupclose', () => {
      if (this.selectedCountryIso3 === iso3) {
        this.selectedCountryIso3 = '';
        this.updateCountryStyles();
      }

      if (this.activePopup?.layer === layer) {
        this.activePopup = undefined;
      }
    });

    layer.once('popupopen', (event: L.PopupEvent) => {
      this.bindCountryPopupButton(event.popup, count);
    });

    layer.openPopup();
  }

  private getCountryPopupHtml(country: ICountry, count: number, iso3: string): string {
    const lang = this._language.currentLanguage;
    const countryName = country.name[lang] ?? country.name.en ?? iso3.toUpperCase();
    const region = REGION_NAMES[country.region]?.[lang] ?? REGION_NAMES[country.region]?.en ?? country.region;
    const continent = this.getContinentName(country.continent);
    const txtBtnGuest = this._translate.instant(count === 1 ? 'MAP.VIEW_GUEST' : 'MAP.VIEW_GUESTS');
    const flagClass = this.getFlagClass(iso3);

    return `
    <div class="country-popup">
      <div class="country-popup-title">${countryName}</div>

      <div class="country-popup-code">
        <span class="${flagClass}" aria-label="${countryName}"></span>
      </div>

      <div class="country-popup-divider"></div>

      <div class="country-popup-row">
        <span>${this._translate.instant('MAP.GUESTS')}</span>
        <strong>${count}</strong>
      </div>

      <div class="country-popup-row">
        <span>${this._translate.instant('MAP.REGION')}</span>
        <strong>${region}</strong>
      </div>

      <div class="country-popup-row">
        <span>${this._translate.instant('MAP.CONTINENT')}</span>
        <strong>${continent}</strong>
      </div>

      <a
        class="view-country-guests"
        data-country-code="${iso3.toLowerCase()}"
      >
        ${txtBtnGuest}
      </a>
    </div>
  `;
  }

  private getAdminRegionPopupHtml(countryName: string, code: string, count: number): string {
    return `
    <div class="country-popup">
      <div class="country-popup-title">${countryName}</div>
      <div class="country-popup-code">${code.toUpperCase()}</div>
      <div class="country-popup-divider"></div>

      <div class="country-popup-row">
        <span>${this._translate.instant('MAP.GUESTS')}</span>
        <strong>${count}</strong>
      </div>

      <div class="country-popup-row">
        <span>${this._translate.instant('MAP.REGION')}</span>
        <strong>${this._translate.instant('MAP.UNITED_KINGDOM')}</strong>
      </div>

      <div class="country-popup-row">
        <span>${this._translate.instant('MAP.CONTINENT')}</span>
        <strong>${this._translate.instant('CONTINENTS.europe')}</strong>
      </div>
    </div>
  `;
  }

  // associate the event with the new generated button
  private bindCountryPopupButton(popup: L.Popup, count: number): void {
    const popupElement = popup.getElement();
    if (!popupElement) return;

    const button = popupElement.querySelector('.view-country-guests') as HTMLAnchorElement | null;

    if (!button) return;

    button.addEventListener(
      'click',
      () => {
        const countryCode = button.dataset['countryCode'];
        if (!countryCode) return;

        const guestIds = this.guestIdsByCountry[countryCode] ?? [];

        if (count === 1 && guestIds.length === 1) {
          void this._router.navigate(['/guests', guestIds[0]]);
          return;
        }

        void this._router.navigate(['/guests'], {
          queryParams: {
            view: 'cards',
            country: countryCode,
          },
        });
      },
      { once: true }
    );
  }

  // FORMAT LABEL
  private formatLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  // GUEST COUNTS
  private getGuestCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    const arrivals: { country: string; timestamp: number }[] = [];

    this.guestIdsByCountry = {};

    for (const row of this.data) {
      if (!row.people) continue;

      const timestamp = Date.parse(row.visitedDate);

      for (const person of row.people) {
        const rawCode = person.hometown?.code?.toLowerCase().trim();

        if (!rawCode) continue;

        let iso3 = '';

        // Keep individual UK region counts and group them under Great Britain.
        if (this.ukRegionCodes.includes(rawCode)) {
          counts[rawCode] = (counts[rawCode] ?? 0) + 1;
          iso3 = 'gbr';
        } else if (rawCode.length === 3 && this.countriesByIso3[rawCode]) {
          iso3 = rawCode;
        } else if (rawCode.length === 2) {
          const country = this.countriesByIso2[rawCode];

          if (country) {
            iso3 = this.iso3ByCountry.get(country) ?? '';
          }
        }

        if (!iso3) continue;

        // Count guests and keep their IDs for country navigation.
        counts[iso3] = (counts[iso3] ?? 0) + 1;

        if (person.guestId) {
          (this.guestIdsByCountry[iso3] ??= []).push(person.guestId);
        }

        // Store valid arrival dates to determine when each country reached its current total.
        if (Number.isFinite(timestamp)) {
          arrivals.push({
            country: iso3,
            timestamp,
          });
        }
      }
    }

    // Process arrivals chronologically, from oldest to newest.
    arrivals.sort((a, b) => a.timestamp - b.timestamp);

    const historicalCounts: Record<string, number> = {};
    const reachedCurrentCountAt: Record<string, number> = {};

    for (const arrival of arrivals) {
      const country = arrival.country;

      historicalCounts[country] = (historicalCounts[country] ?? 0) + 1;

      // Save the first date each country reached its current guest count.
      if (historicalCounts[country] === counts[country] && reachedCurrentCountAt[country] === undefined) {
        reachedCurrentCountAt[country] = arrival.timestamp;
      }
    }

    const countryCodes = Object.keys(counts).filter(code => !this.ukRegionCodes.includes(code));

    countryCodes.sort((a, b) => {
      // The country with the most guests wins.
      const countDifference = counts[b] - counts[a];

      if (countDifference !== 0) {
        return countDifference;
      }

      // If tied, the country that reached its current total first wins.
      const dateA = reachedCurrentCountAt[a] ?? Infinity;
      const dateB = reachedCurrentCountAt[b] ?? Infinity;

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // Use alphabetical order as a fallback when dates cannot break the tie.
      return a.localeCompare(b);
    });

    this.topGuestCountryIso3 = countryCodes[0] ?? '';

    return counts;
  }

  private getAdminRegionsMap(): void {
    this._map.getAdminRegionsMap().subscribe({
      next: geoJson => {
        this.adminRegionsGeoJsonData = geoJson;
        this.createAdminRegionsLayer();
        this.updateGuestMarkers();
      },
      error: error => {
        console.error('Error loading Natural Earth ADM1:', error);
      },
    });
  }

  private createAdminRegionsLayer(): void {
    if (!this.map || !this.adminRegionsGeoJsonData) {
      return;
    }

    // Evitamos crear la capa dos veces
    this.adminRegionsLayer?.remove();
    this.adminRegionsLayer = undefined;

    // Agrupamos las regiones por país
    const featuresByRegion: Record<string, any[]> = {};
    for (const feature of this.adminRegionsGeoJsonData.features) {
      const code = feature.properties?.gu_a3?.toLowerCase();
      if (!code || !this.ukRegionCodes.includes(code)) {
        continue;
      }
      if (!featuresByRegion[code]) {
        featuresByRegion[code] = [];
      }
      featuresByRegion[code].push(feature);
    }

    // We merge the internal regions of each country Scotland: Scottish Borders, Highland,Glasgow etc: Scotland = a single geometry

    const dissolvedFeatures: any[] = [];
    for (const code of this.ukRegionCodes) {
      const features = featuresByRegion[code];
      if (!features?.length) {
        continue;
      }
      try {
        const merged = union(featureCollection(features));
        if (!merged) {
          console.warn(`Could not merge region: ${code}`);
          continue;
        }

        // We keep our code
        merged.properties = {
          ...merged.properties,
          gu_a3: code.toUpperCase(),
        };

        dissolvedFeatures.push(merged);
      } catch (error) {
        console.error(`Error merging ${code}:`, error);
      }
    }

    // We create a SINGLE geometry for each:SCT, WLS, NIR, ENG
    this.adminRegionsLayer = L.geoJSON(
      {
        type: 'FeatureCollection',
        features: dissolvedFeatures,
      } as any,
      {
        style: (feature: any): L.PathOptions => {
          const code = feature.properties?.gu_a3?.toLowerCase();
          const count = code ? (this.guestCounts[code] ?? 0) : 0;

          return {
            color: '#ffffff',
            weight: count > 0 ? 0.5 : 1,
            opacity: count > 0 ? 1 : 1,
            fillColor: count > 0 ? this.getCountryColor(count) : '#000000',
            fillOpacity: count > 0 ? 0.85 : 0.35,
            interactive: true,
          };
        },

        onEachFeature: (feature: any, layer: L.Layer): void => {
          this.setupAdminRegionInteraction(feature, layer);
        },
      }
    ).addTo(this.map);
    this.updateCountryStyles();
  }

  private setupAdminRegionInteraction(feature: any, layer: L.Layer): void {
    const code = feature.properties?.gu_a3?.toLowerCase();
    if (!code) return;

    const countryName = this._translate.instant(`UK_REGIONS.${code}`);

    // HOVER
    layer.bindTooltip(`<strong>${countryName}</strong>`, {
      sticky: true,
      direction: 'top',
      opacity: 1,
      className: 'country-hover-tooltip',
    });

    // MOUSE EVENTS
    layer.on({
      mouseover: (event: any) => {
        const target = event.target;
        const currentCount = this.guestCounts[code] ?? 0;

        target.setStyle({
          weight: 2,
          color: '#ffffff',
          fillOpacity: currentCount > 0 ? 0.95 : 0.45,
        });

        target.bringToFront();
      },

      mouseout: () => {
        this.updateCountryStyles();
      },
    });

    // CLICK
    layer.on('click', () => {
      const currentCount = this.guestCounts[code] ?? 0;

      if (currentCount === 0) {
        return;
      }

      this.showAdminRegionPopup(layer, countryName, code, currentCount);
    });
  }

  private showAdminRegionPopup(layer: L.Layer, countryName: string, code: string, count: number): void {
    this.activePopup = {
      type: 'admin-region',
      layer,
      code,
      count,
    };

    const html = this.getAdminRegionPopupHtml(countryName, code, count);

    layer.bindPopup(html, {
      closeButton: true,
      autoClose: true,
      closeOnClick: true,
      className: 'country-popup-container',
      maxWidth: 280,
    });

    layer.openPopup();
  }

  // Color theme
  private updateMapTheme(): void {
    if (!this.map) return;

    const isDark = document.documentElement.classList.contains('dark-theme') || document.body.classList.contains('dark-theme');

    if (this.isDarkMap === isDark && this.tileLayer) {
      this.updateCountryStyles();
      return;
    }

    this.isDarkMap = isDark;
    this.tileLayer?.remove();

    const mapTheme = isDark ? 'dark_all' : 'light_all';

    this.tileLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${mapTheme}/{z}/{x}/{y}{r}.png?key=${environment.apiKeyCarto}`, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      keepBuffer: 3,
      updateWhenZooming: true,
      updateWhenIdle: true,
    }).addTo(this.map);

    // Refresh country colors when the map theme changes.
    this.updateCountryStyles();
  }

  private watchThemeChanges(): void {
    this.themeObserver = new MutationObserver(() => {
      this.updateMapTheme();
    });

    const options = {
      attributes: true,
      attributeFilter: ['class'],
    };

    this.themeObserver.observe(document.documentElement, options);
    this.themeObserver.observe(document.body, options);
  }

  private getMapColor(variable: string, fallback: string): string {
    if (!this.mapContainer) {
      return fallback;
    }

    const color = getComputedStyle(this.mapContainer).getPropertyValue(variable).trim();

    return color || fallback;
  }

  // MAP MARKERS
  // Finds the GeoJSON polygon that matches a guest's hometown
  // Supports alternative region names and combines multiple matching regions

  private getHometownPolygon(countryCode: string, stateName: string): Feature<Polygon | MultiPolygon> | null {
    if (!this.adminRegionsGeoJsonData || !countryCode || !stateName) {
      return null;
    }

    const normalize = (value: string): string =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const rawCountry = normalize(countryCode);

    // Convert ISO2 country codes to ISO3.
    const countryInfo = rawCountry.length === 2 ? this.countriesByIso2[rawCountry] : this.countriesByIso3[rawCountry];
    const country = countryInfo ? (this.iso3ByCountry.get(countryInfo) ?? '') : rawCountry;
    const state = normalize(stateName);
    const stateAliases: Record<string, string[]> = {
      'canary islands': ['canary is.', 'las palmas', 'santa cruz de tenerife'],
    };

    const searchNames = [state, ...(stateAliases[state] ?? []).map(normalize)];

    const matches = this.adminRegionsGeoJsonData.features.filter(feature => {
      const properties = feature.properties as Record<string, unknown>;
      const featureCountry = normalize(String(properties['adm0_a3'] ?? ''));

      if (featureCountry !== country) return false;

      const names = [properties['name'], properties['name_es'], properties['name_alt'], properties['region'], properties['region_sub']]
        .filter((value): value is string => typeof value === 'string')
        .map(normalize);

      return names.some(name => searchNames.includes(name));
    });

    if (!matches.length) return null;

    if (matches.length === 1) {
      return matches[0] as Feature<Polygon | MultiPolygon>;
    }

    const collection = featureCollection(matches as Feature<Polygon | MultiPolygon>[]);

    return union(collection) as Feature<Polygon | MultiPolygon> | null;
  }

  // Finds the country polygon when the hometown region cannot be matched.
  private getCountryPolygon(countryCode: string): Feature<Polygon | MultiPolygon> | null {
    if (!this.geoJsonData || !countryCode) {
      return null;
    }

    const rawCode = countryCode.toLowerCase().trim();

    const countryInfo = rawCode.length === 2 ? this.countriesByIso2[rawCode] : this.countriesByIso3[rawCode];

    const iso3 = countryInfo ? (this.iso3ByCountry.get(countryInfo) ?? '') : rawCode;

    // Map territories to their corresponding country.
    const countryAliases: Record<string, string> = {
      mtq: 'fra',
      sct: 'gbr',
    };

    const resolvedIso3 = countryAliases[iso3] ?? iso3;

    if (!resolvedIso3) return null;

    const countryFeature = this.geoJsonData.features.find(feature => {
      return this.getCountryConfig(feature).iso3 === resolvedIso3;
    });

    if (!countryFeature || !['Polygon', 'MultiPolygon'].includes(countryFeature.geometry.type)) {
      return null;
    }

    return countryFeature as Feature<Polygon | MultiPolygon>;
  }

  // Generates a reproducible random number sequence from a string seed
  // The same guest ID always produces the same random values
  private createSeededRandom(seed: string): () => number {
    let value = 0;

    // Convert the seed string into a numeric value.
    for (let i = 0; i < seed.length; i++) {
      value = (value * 31 + seed.charCodeAt(i)) | 0;
    }

    // Generate deterministic values between 0 and 1.
    return () => {
      value = (value * 1664525 + 1013904223) | 0;
      return (value >>> 0) / 4294967296;
    };
  }

  //  Generates deterministic coordinates inside a guest's hometown polygon.
  private getGuestCoordinates(polygon: Feature<Polygon | MultiPolygon>, guestId: string): [number, number] | null {
    const random = this.createSeededRandom(guestId);

    // Convert MultiPolygon geometry into individual Polygon features.
    const polygons: Feature<Polygon>[] =
      polygon.geometry.type === 'Polygon'
        ? [polygon as Feature<Polygon>]
        : polygon.geometry.coordinates.map(coordinates =>
            feature({
              type: 'Polygon',
              coordinates,
            })
          );

    // Select a polygon proportionally to its area.
    const totalArea = polygons.reduce((total, item) => total + area(item), 0);

    if (!totalArea) return null;

    let selectedArea = random() * totalArea;
    const selectedPolygon =
      polygons.find(item => {
        selectedArea -= area(item);
        return selectedArea <= 0;
      }) ?? polygons[0];

    // Generate random points within the polygon's bounding box.
    const [minLng, minLat, maxLng, maxLat] = bbox(selectedPolygon);

    // Keep only points that fall inside the selected polygon.
    for (let attempt = 0; attempt < 5000; attempt++) {
      const lng = minLng + random() * (maxLng - minLng);
      const lat = minLat + random() * (maxLat - minLat);
      const candidate = point([lng, lat]);

      if (booleanPointInPolygon(candidate, selectedPolygon)) return [lat, lng];
    }
    return null;
  }

  // Creates a custom HTML marker instead of using Leaflet's default image icons.
  private createGuestMarkerIcon(): L.DivIcon {
    return L.divIcon({
      className: 'guest-marker-wrapper',
      html: '<span class="guest-marker"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  // Rebuilds guest markers using their hometown regions and generated coordinates.
  private updateGuestMarkers(): void {
    if (!this.map || !this.adminRegionsGeoJsonData || !this.guestMarkersLayer) {
      return;
    }

    // Remove previous markers before rebuilding.
    this.guestMarkersLayer.clearLayers();
    this.guestMarkerPeople.clear();

    const processedGuests = new Set<string>();

    // Cache polygons to avoid searching the GeoJSON repeatedly.
    const polygonCache = new Map<string, Feature<Polygon | MultiPolygon> | null>();

    for (const row of this.data) {
      for (const person of row.people) {
        const countryCode = person.hometown?.code;
        const stateName = person.hometown?.state;
        const guestId = person.guestId;

        // Skip guests without location data or already processed.
        if (!countryCode || !stateName || !guestId || processedGuests.has(guestId)) continue;

        processedGuests.add(guestId);
        const cacheKey = `${countryCode}-${stateName}`;

        // Reuse the polygon when multiple guests share the same hometown.
        if (!polygonCache.has(cacheKey)) {
          polygonCache.set(cacheKey, this.getHometownPolygon(countryCode, stateName));
        }

        // Use the country polygon when the hometown region cannot be matched.
        const polygon = polygonCache.get(cacheKey) ?? this.getCountryPolygon(countryCode);

        if (!polygon) {
          console.warn('[Guest marker] Country polygon not found:', {
            countryCode,
            stateName,
          });

          continue;
        }

        // Generate a stable position for each guest.
        const coordinates = this.getGuestCoordinates(polygon, guestId);

        if (!coordinates) continue;

        // Create the marker and attach the guest popup.
        const marker = L.marker(coordinates, {
          title: person.fullName,
          icon: this.createGuestMarkerIcon(),
        });
        marker.bindPopup(this.createGuestPopup(person), {
          className: 'guest-map-popup-container',
        });

        // Keep the guest associated with its marker.
        this.guestMarkerPeople.set(marker, person);

        marker.addTo(this.guestMarkersLayer);
      }
    }
  }

  // Builds the HTML content displayed when a guest marker is clicked.
  private createGuestPopup(person: IGuestTableMember): HTMLElement {
    const container = document.createElement('div');
    container.className = 'guest-map-popup';

    const name = document.createElement('strong');
    name.textContent = person.fullName;

    const hometown = document.createElement('p');
    const location = [person.hometown?.city, person.hometown?.state].filter(Boolean).join(', ');
    const countryCode = person.hometown?.code;
    const flag = document.createElement('span');
    flag.className = this.getFlagClass(countryCode);

    hometown.append(flag);

    if (location) {
      hometown.append(document.createTextNode(` ${location}`));
    }

    // Create a button to navigate to the guest detail page.
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'guest-map-popup-btn';
    button.textContent = this._translate.instant('MAP.VIEW_GUEST');
    button.addEventListener('click', () => {
      if (!person.guestId) return;

      void this._router.navigate(['/guests', person.guestId]);
    });

    button.disabled = !person.guestId;
    container.append(name, hometown, button);
    return container;
  }

  private getFlagClass(countryCode?: string | null): string {
    if (!countryCode) return 'fi fi-xx';
    const key = countryCode.toLowerCase() as keyof typeof WORLD;
    return WORLD[key] ? `fi fi-${WORLD[key].flag}` : 'fi fi-xx';
  }
}
