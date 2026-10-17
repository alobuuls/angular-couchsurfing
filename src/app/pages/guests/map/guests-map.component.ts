import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { MapService } from '@services/map.service';
import { LanguageService } from '@services/language.service';

// Interfaces
import { IGuestTableRow } from '@interfaces/data-structure-api';
import { IAdminRegionsGeoJson, IWorldGeoJson } from '@interfaces/map-interface';
import { REGION_NAMES } from '@config/world/regions';

// Country data
import { WORLD } from '@config/world';

// Types
import { ICountry } from '@type/word.types';

// Libraries
import * as L from 'leaflet';
import { union } from '@turf/union';
import { featureCollection } from '@turf/helpers';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'guests-map',
  templateUrl: './guests-map.component.html',
  styleUrls: ['./guests-map.component.css'],
})
export class GuestsMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: IGuestTableRow[] = [];

  private readonly _map = inject(MapService);
  private readonly _language = inject(LanguageService);
  private readonly _translate = inject(TranslateService);
  private readonly _router = inject(Router);

  private languageSubscription?: Subscription;

  private mapContainer?: HTMLDivElement;
  private geoJsonData?: IWorldGeoJson;

  private map?: L.Map;
  private geoLayer?: L.GeoJSON;

  private tileLayer?: L.TileLayer;
  private themeObserver?: MutationObserver;
  private isDarkMap?: boolean;

  // Regions GeoJson
  private adminRegionsGeoJsonData?: IAdminRegionsGeoJson;
  private adminRegionsLayer?: L.GeoJSON;
  private readonly ukRegionCodes = ['sct', 'wls', 'eng', 'nir'];

  private resizeObserver?: ResizeObserver;

  /**
   * Guests por país.
   *
   * Siempre intentamos guardar aquí ISO3:
   *
   * {
   *   col: 10,
   *   fra: 4,
   *   nor: 2
   * }
   */
  private guestCounts: Record<string, number> = {};

  /**
   * Lookup ISO3 -> Country
   */
  private readonly countriesByIso3: Record<string, ICountry> = {};

  /**
   * Lookup ISO2 -> Country
   */
  private readonly countriesByIso2: Record<string, ICountry> = {};

  /**
   * Lookup nombre normalizado -> Country
   */
  private readonly countriesByName: Record<string, ICountry> = {};

  /**
   * Lookup Country -> ISO3
   *
   * Nos evita tener que hacer Object.entries(WORLD).find(...)
   * cada vez.
   */
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
  }

  private watchLanguageChanges(): void {
    this.languageSubscription = this._translate.onLangChange.subscribe(() => this.updateTooltipsLanguage());
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

      /**
       * ISO2
       *
       * country.flag contiene:
       *
       * col -> co
       * fra -> fr
       * nor -> no
       */
      if (country.flag) {
        this.countriesByIso2[country.flag.toLowerCase().trim()] = country;
      }

      /**
       * Nombre
       */
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
      if (!value) {
        continue;
      }

      const code = String(value).toLowerCase().trim();

      if (code === '-99' || code === 'null' || code === 'undefined' || code.length !== 3) {
        continue;
      }

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
      if (!value) {
        continue;
      }
      const code = String(value).toLowerCase().trim();

      if (code === '-99' || code === 'null' || code === 'undefined' || code.length !== 2) {
        continue;
      }
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
  }

  // RESIZE OBSERVER
  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) {
      return;
    }
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
    /**
     * No usamos fitBounds() porque algunos GeoJSON mundiales pueden
     * tener geometrías que provocan bounds demasiado grandes o extraños.
     *
     * Esta posición es mucho más estable.
     */
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

        if (!feature) {
          return;
        }

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

      // If there are not guest, the popup is not
      if (currentCount === 0 || !country) return;
      this.showCountryPopup(layer, country?.name[this._language.currentLanguage] ?? country?.name.en ?? countryName, country, currentCount, iso3);
    });
  }

  // COUNTRY POPUP
  private showCountryPopup(layer: L.Layer, countryName: string, country: ICountry, count: number, iso3: string): void {
    const lang = this._language.currentLanguage;
    const translatedCountry = countryName;
    const region = REGION_NAMES[country.region]?.[lang] ?? REGION_NAMES[country.region]?.en ?? country.region;
    const continent = this._translate.instant(`CONTINENTS.${country.continent}`);
    const txtBtnGuest = count === 1 ? this._translate.instant('MAP.VIEW_GUEST') : this._translate.instant('MAP.VIEW_GUESTS');

    const html = `
    <div class="country-popup">
      <div class="country-popup-title">
        ${translatedCountry}
      </div>

      <div class="country-popup-code">
        ${iso3.toUpperCase()}
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

    layer.bindPopup(html, {
      closeButton: true,
      autoClose: true,
      closeOnClick: true,
      className: 'country-popup-container',
      maxWidth: 280,
    });

    // Connect the dynamically generated Leaflet button.
    layer.once('popupopen', (event: any) => {
      const popupElement = event.popup.getElement() as HTMLElement | undefined;

      const button = popupElement?.querySelector('.view-country-guests') as HTMLButtonElement | null;

      button?.addEventListener(
        'click',
        () => {
          const countryCode = button.dataset['countryCode'];

          if (!countryCode) return;

          const guestIds = this.guestIdsByCountry[countryCode] ?? [];

          // If there is exactly one guest, open their detail page.
          if (count === 1 && guestIds.length === 1) {
            void this._router.navigate(['/guests', guestIds[0]]);
            return;
          }

          // Otherwise, show the guests in cards view.
          void this._router.navigate(['/guests'], {
            queryParams: {
              view: 'cards',
              country: countryCode,
            },
          });
        },
        { once: true }
      );
    });

    layer.openPopup();
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

    // Display ranking details for debugging.
    console.table(
      countryCodes.map(country => ({
        country: country.toUpperCase(),
        guests: counts[country],
        reachedCurrentCountAt: reachedCurrentCountAt[country] ? new Date(reachedCurrentCountAt[country]).toLocaleDateString() : 'Unknown',
        winner: country === this.topGuestCountryIso3,
      }))
    );

    return counts;
  }

  private getAdminRegionsMap(): void {
    this._map.getAdminRegionsMap().subscribe({
      next: geoJson => {
        this.adminRegionsGeoJsonData = geoJson;
        console.log('NATURAL EARTH ADM1:', geoJson);
        this.createAdminRegionsLayer();
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
    // Unimos las regiones internas de cada país
    // Scotland:
    //   Scottish Borders
    //   Highland
    //   Glasgow
    //   etc.
    // ↓
    // Scotland = una sola geometría

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

        // Conservamos nuestro código
        merged.properties = {
          ...merged.properties,
          gu_a3: code.toUpperCase(),
        };

        dissolvedFeatures.push(merged);
      } catch (error) {
        console.error(`Error merging ${code}:`, error);
      }
    }

    // Creamos UNA sola geometría por:
    // SCT
    // WLS
    // NIR
    // ENG

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
    const html = `
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
}
