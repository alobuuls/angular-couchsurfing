import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';

import * as L from 'leaflet';

// Services
import { MapService } from '@services/map.service';

// Interfaces
import { IGuestTableRow } from '@interfaces/data-structure-api';
import { IAdminRegionsGeoJson, IWorldGeoJson } from '@interfaces/map-interface';

// Country data
import { WORLD } from '@config/world';

// Types
import { ICountry } from '@type/word.types';

import { union } from '@turf/union';
import { featureCollection } from '@turf/helpers';

@Component({
  selector: 'guests-map',
  templateUrl: './guests-map.component.html',
  styleUrls: ['./guests-map.component.css'],
})
export class GuestsMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data: IGuestTableRow[] = [];

  private readonly _map = inject(MapService);

  private mapContainer?: HTMLDivElement;
  private geoJsonData?: IWorldGeoJson;

  private map?: L.Map;
  private geoLayer?: L.GeoJSON;

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

  @ViewChild('mapCtn')
  set mapCtn(element: ElementRef<HTMLDivElement> | undefined) {
    if (!element) {
      return;
    }

    this.mapContainer = element.nativeElement;

    this.tryInitMap();
  }

  // LIFECYCLE

  ngOnInit(): void {
    this.buildCountryLookups();

    this.guestCounts = this.getGuestCounts();

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
    this.resizeObserver?.disconnect();

    this.resizeObserver = undefined;

    this.map?.remove();

    this.map = undefined;
    this.geoLayer = undefined;
    this.geoJsonData = undefined;
    this.adminRegionsGeoJsonData = undefined;
    this.mapContainer = undefined;
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
        this.countriesByName[this.normalizeCountryName(country.name)] = country;
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

    // TILE LAYER
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      keepBuffer: 3,
      updateWhenZooming: true,
      updateWhenIdle: true,
    }).addTo(this.map);

    // GUEST COUNTS
    this.guestCounts = this.getGuestCounts();

    // GEOJSON
    this.createGeoLayer();

    // RESIZE OBSERVER
    this.setupResizeObserver();

    // INVALIDATE SIZE
    requestAnimationFrame(() => {
      this.map?.invalidateSize({animate: false });
    });

    setTimeout(() => {
      this.map?.invalidateSize({ animate: false,});
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

    // 0 GUESTS
    if (count === 0) {
      return {
        color: '#ffffff',
        weight: 1,
        opacity: 0.45,
        fillColor: '#000000',
        fillOpacity: 0.35,

        // IMPORTANTE:
        // Necesitamos que Leaflet detecte el mouse
        // para poder mostrar el tooltip.
        interactive: true,
      };
    }

    // HAS GUESTS
    return {
      color: '#ffffff',
      weight: 2,
      opacity: 0.85,
      fillColor: this.getCountryColor(count),
      fillOpacity: 0.75,
      interactive: true,
    };
  }

  // COUNTRY COLOR
  private getCountryColor(count: number): string {
    if (count < 3) {
      return '#2c420373';
    }
    if (count < 5) {
      return '#0b96a55f';
    }
    if (count < 10) {
      return '#2c0768a1';
    }
    return '#ff0000bb';
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
        if (layer instanceof L.Path) {
          layer.setStyle({
            color: '#ffffff',
            weight: 1,
            opacity: 0.85,
            fillColor: count > 0 ? this.getCountryColor(count) : '#000000',
            fillOpacity: count > 0 ? 0.85 : 0.35,
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
      country?.name ?? feature?.properties?.name ?? feature?.properties?.ADMIN ?? feature?.properties?.NAME_EN ?? feature?.properties?.NAME ?? 'Unknown country';
    const iso3 = config.iso3;
    const count = iso3 ? (this.guestCounts[iso3] ?? 0) : 0;

    // 0 GUESTS
    if (count === 0) {
      layer.bindTooltip(`<strong>${countryName}</strong>`, {
        sticky: true,
        direction: 'top',
        opacity: 0.95,
        className: 'country-zero-tooltip',
      });

      return;
    }

    // HOVER
    layer.bindTooltip(`<strong>${countryName}</strong>`, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
      className: 'country-hover-tooltip',
    });

    // MOUSE EVENTS
    layer.on({
      mouseover: (event: any) => {
        const target = event.target;
        target.setStyle({
          weight: 2,
          color: '#ffffff',
          fillOpacity: 0.95,
        });
        target.bringToFront();
      },
      mouseout: (event: any) => {
        if (!this.geoLayer) {
          return;
        }
        this.geoLayer.resetStyle(event.target);
      },
    });

    // CLICK
    if (!country) {
      return;
    }
    layer.on('click', () => {
      this.showCountryPopup(layer, countryName, country, count, iso3);
    });
  }

  // COUNTRY POPUP
  private showCountryPopup(layer: L.Layer, countryName: string, country: ICountry, count: number, iso3: string): void {
    const region = String(country.region);
    const continent = String(country.continent);
    const html = `
      <div class="country-popup">

        <div class="country-popup-title">
          ${countryName}
        </div>

        <div class="country-popup-code">
          ${iso3.toUpperCase()}
        </div>

        <div class="country-popup-divider"></div>

        <div class="country-popup-row">
          <span>Guests</span>
          <strong>${count}</strong>
        </div>

        <div class="country-popup-row">
          <span>Region</span>
          <strong>${this.formatLabel(region)}</strong>
        </div>

        <div class="country-popup-row">
          <span>Continent</span>
          <strong>${this.formatLabel(continent)}</strong>
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

  // FORMAT LABEL
  private formatLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  // GUEST COUNTS
  private getGuestCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of this.data) {
      if (!row.people) {
        continue;
      }
      for (const person of row.people) {
        const rawCode = person.hometown?.code?.toLowerCase().trim();
        if (!rawCode) {
          continue;
        }

        // UK ADMINISTRATIVE REGIONS
        if (this.ukRegionCodes.includes(rawCode)) {
          counts[rawCode] = (counts[rawCode] ?? 0) + 1;
          continue;
        }
        let iso3 = '';

        // ISO3
        if (rawCode.length === 3 && this.countriesByIso3[rawCode]) {
          iso3 = rawCode;
        }
        // ISO2
        if (!iso3 && rawCode.length === 2) {
          const country = this.countriesByIso2[rawCode];
          if (country) {
            iso3 = this.iso3ByCountry.get(country) ?? '';
          }
        }

        // Si no encontramos el país
        if (!iso3) {
          console.warn(`Country code not found in WORLD: ${rawCode}`);
          continue;
        }
        counts[iso3] = (counts[iso3] ?? 0) + 1;
      }
    }
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
            weight: count > 0 ? 2 : 1,
            opacity: count > 0 ? 0.9 : 0.45,
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
  }

  private setupAdminRegionInteraction(feature: any, layer: L.Layer): void {
    const code = feature.properties?.gu_a3?.toLowerCase();

    if (!code) {
      return;
    }

    const names: Record<string, string> = {
      sct: 'Scotland',
      wls: 'Wales',
      nir: 'Northern Ireland',
      eng: 'England',
    };

    const countryName = names[code] ?? 'United Kingdom';
    const count = this.guestCounts[code] ?? 0;

    // =========================================================
    // HOVER
    // =========================================================

    layer.bindTooltip(`<strong>${countryName}</strong>`, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
      className: count > 0 ? 'country-hover-tooltip' : 'country-zero-tooltip',
    });

    // =========================================================
    // MOUSE EVENTS
    // =========================================================

    layer.on({
      mouseover: (event: any) => {
        const target = event.target;

        target.setStyle({
          weight: 2,
          color: '#ffffff',
          fillOpacity: count > 0 ? 0.95 : 0.45,
        });

        target.bringToFront();
      },

      mouseout: (event: any) => {
        const target = event.target;
        const currentCount = this.guestCounts[code] ?? 0;

        target.setStyle({
          weight: currentCount > 0 ? 2 : 1,
          color: '#ffffff',
          opacity: currentCount > 0 ? 0.9 : 0.45,
          fillColor: currentCount > 0 ? this.getCountryColor(currentCount) : '#000000',
          fillOpacity: currentCount > 0 ? 0.85 : 0.35,
        });
      },
    });

    // =========================================================
    // CLICK
    // =========================================================

    // Si NO tiene guests → no hacemos nada
    if (count === 0) {
      return;
    }

    // Si tiene guests → popup
    layer.on('click', () => {
      this.showAdminRegionPopup(layer, countryName, code, count);
    });
  }

  private showAdminRegionPopup(layer: L.Layer, countryName: string, code: string, count: number): void {
    const html = `
    <div class="country-popup">

      <div class="country-popup-title">
        ${countryName}
      </div>

      <div class="country-popup-code">
        ${code.toUpperCase()}
      </div>

      <div class="country-popup-divider"></div>

      <div class="country-popup-row">
        <span>Guests</span>
        <strong>${count}</strong>
      </div>

      <div class="country-popup-row">
        <span>Region</span>
        <strong>United Kingdom</strong>
      </div>

      <div class="country-popup-row">
        <span>Continent</span>
        <strong>Europe</strong>
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
}
