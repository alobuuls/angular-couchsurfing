# Frontend

// no required

- nights
- insta
- hometown
- livingIn
- **occupation**
- age
- instagram
- rating
- NIGHTS
- RATING
- OCCUPATION

## // later

- REFERENCES: acomodar mejor
- el rating ponerle color

## // IMPORTANT

- Data quemada en countries top, bottom,top female, top male
- Cambiar la grafica de summary nights y rating
- Revisarla visited date del guest en las graficas que usen date
- si es posible en el hover de la grafica mostar nombre del pais de donde es ese guest
- oldest y youngest deberian aparecen en diferente orden
- Devolver el country en vez del country code en el tooltip
- cuando le doy click a la grafica me aparezca la lista de los guests
-
- // FORMS
- edit que carguen: Hometown Country | Hometown State | Living In Country | Living In State | OccupationArea
- el edit no hace post
-
-
- // OTROS
- probar los codigos de los países con england etc
- Bug map api key
- bug map quantity of guests, show visites
- Bug scotland
- Prefix autocomplete
- Titlecase en continent , guest-table
- Gráfico de áreas | Gráficas de dispersión | Gráfico de burbuja | Gráfico de radar / araña | heatmap
- en las tarjetas por mes poner un numero como contandolas pero por mes
- en los filtros tanto para continent como para region y country que sea un select multiple en vez de solo
  seleccionar uno
- mejorar UI de detail
- en las tarjetas cuando le den click en read more mostrar el detalle
- personal
- crear login
- crear register
- crear admin
- es invalido cargue una bandera por defecto pipe colocar no results en los que no
- agregar un boton en el mapa que lo vuelva 3d
- en el de eliminar que haya opcion de copiar en el nombre para el modal de confirmacion
- Agregar la flag a las cards
- validar cuando viene vacia la data en los graficos a futuro
- Agregar un calendario con los guests que compartieron estancia, y cada grupo con su grafica

# Backend

- Whatsapp nno es required?
- remove nigths of required {success: false, message: "Missing required field: "nights"",…} errors : [{field:
  "nights", message: ""nights" is required but was not provided"}] message : "Missing required field:
  \"nights\"" success : false
- si es mayor la pagina a lo que hay devolver error en eliminar devolver la data
- del usuario al que se elimino está vininendo en null
-
-
-
-
-
-

HTML

```
  <div class="table-container mat-elevation-z8">
    <table mat-table [dataSource]="dataSource">
      <!-- Loop through columns dynamically using *ngFor -->
      <ng-container *ngFor="let col of columnConfigs" [matColumnDef]="col.key">
        <ng-container>
          <th mat-header-cell *matHeaderCellDef>{{ col.label }}</th>
          <td mat-cell *matCellDef="let el">
            <ng-container *ngIf="col.key !== 'actions'">
              {{ el[col.key] }}
            </ng-container>

            <ng-container *ngIf="col.key === 'actions'">
              <button (click)="create(el)">create</button>
            </ng-container>
          </td>
        </ng-container>
      </ng-container>

      <!-- Header and Row declarations required by Angular Material -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns2"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns2"></tr>
    </table>
  </div>
```

# TS

```

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    living: string;
    age: number;
    country: string;
    city: string;
  }

  // 1. Define your data source
  dataSource: User[] = [
    { id: 1, name: 'Alice Smith 1', email: 'alice1@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 2, name: 'Alice Smith 2', email: 'alice2@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 3, name: 'Alice Smith 3', email: 'alice3@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 4, name: 'Alice Smith 4', email: 'alice4@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 5, name: 'Alice Smith 5', email: 'alice5@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 6, name: 'Alice Smith 6', email: 'alice6@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 7, name: 'Alice Smith 7', email: 'alice7@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 8, name: 'Alice Smith 8', email: 'alice8@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 9, name: 'Alice Smith 9', email: 'alice9@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 10, name: 'Alice Smith 0', email: 'alice0@example.com', role: 'Admin', country: 'col', age: 15, city: 'bog', living: 'col' },
    { id: 11, name: 'Alice Smith 1', email: 'alice1@example.com', role: 'Admin', country: 'col', age: 15, city: 'alb', living: 'col' },
  ];

  // 2. Define configuration for columns to loop over with *ngFor
  columnConfigs = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    { key: 'role', label: 'Rol' },
    { key: 'age', label: 'Edad' },
    { key: 'city', label: 'Ciudad' },
    { key: 'country', label: 'País' },
    { key: 'living', label: 'Viviendo' },
    { key: 'actions', label: 'Acciones' },
  ];

  // 3. Extract just the keys array for mat-table internal configuration
  get displayedColumns2(): string[] {
    return this.columnConfigs.map(col => col.key);
  }

  create(el: User) {
    console.log('clicked on create', el.name);
  }
```

# no results

```
  getAllGuests(): void {
    this.vm$ = withReqState(this._cs.getAllGuests(), this._errH).pipe(
      map(state => {
        if (state.status === 'success') {
          return {
            ...state,
            data: state.data.map((g: any) => {
              Object.entries(g).map(([k, v]) => {
                const excluded = 'coupleId';
                if (!k.includes(excluded) && v === null) {
                  g[k] = 'No results';
                }
              });
              return g;
            }),
          };
        }

        return state;
      })
    );
  }
```

-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-
-

```

  // Countries
  continents: string[] = [];
  regions: string[] = [];
  countries: Array<Country & { countryCode: string }> = [];
  filterCountries: Array<Country & { countryCode: string }> = [];

  loadDataCountries(): void {
    this.countries = Object.entries(WORLD)
      .map(([countryCode, country]) => ({ countryCode, ...country }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  loadContinents(): void {
    this.continents = [...new Set(this.countries.map(country => country.continent))];
  }

  onContinent(): void {
    this.formCreateGuest.get('continent')?.valueChanges.subscribe(continent => {
      this.regions = [...new Set(this.countries.filter(country => country.continent === continent).map(country => country.region))];

      this.filterCountries = [];

      console.log(this.regions);

      this.formCreateGuest.patchValue({
        region: '',
        countryCode: '',
        prefixCode: '',
      });
    });
  }

  onRegion(): void {
    this.formCreateGuest.get('region')?.valueChanges.subscribe(region => (this.filterCountries = this.countries.filter(country => country.region === region)));

    this.formCreateGuest.patchValue({
      countryCode: '',
      prefixCode: '',
    });
  }

  onCountry(): void {
    this.formCreateGuest.get('countryCode')?.valueChanges.subscribe(countryCode => {
      const country = this.countries.find(country => country.countryCode === countryCode);
      if (!country) return;
      this.formCreateGuest.patchValue({
        prefixCode: country.prefix,
        continent: country.continent,
        region: country.region,
      });
    });
  }
}

```

/// <!-- HOMETOWN CON AUTOCOMPLETE--> <mat-form-field appearance="outline"> <mat-label>Hometown
Country</mat-label>

      <input
        matInput
        formControlName="hometownCode"
        [matAutocomplete]="autoHometown"
        (input)="filterHometowns($event)"
      />

      <mat-autocomplete #autoHometown="matAutocomplete">
        <mat-option *ngFor="let country of filteredCountries" [value]="country.countryCode">
          <span [class]="country.countryCode | flag"></span>
          {{ country.name }}</mat-option
        >
      </mat-autocomplete>

      <!-- errors -->
      <mat-error *ngIf="formCreateGuest.get('hometownCode')?.hasError('required')">Country is required</mat-error>
    </mat-form-field>

    <div *ngIf="formCreateGuest.get('hometownCode')?.value">
      <p>Continent: {{ formCreateGuest.get('continent')?.value }}</p>
      <p>Region: {{ formCreateGuest.get('region')?.value }}</p>
      <p>Prefix: {{ formCreateGuest.get('prefixCode')?.value }}</p>
    </div>

me ayudas con el indice?

es por chapters

en la hoja 1 esta el The Traveler (la ficha) 2 chapter 1 madrid, spain : WHERE IT ALL BEGAN 8 chapter 2 rome,
italy : THE ETERNAL CITY 14 chapter 3 vatican city, vatican : THE SMALLEST STATE 16 chapter 4 venice, italy :
THE FLOATING CITY 22 chapter 5 pisa, italy : THE FLOATING CITY 28 chapter 6 paris, france : THE CITY OF LIGHTS
34 chapter 7 brussels, belgium : THE HEART OF EUROPE 40 chapter 8 rotterdam, netherlands : THE MODERN HORIZON
46 chapter 9 amsterdam, netherlands : THE CITY OF CANALS 52 chapter 10 prague, czech republic : THE CITY OF A
THOUSAND STORIES 58 chapter 11 vienna, austria : THE IMPERIAL CITY 64 chapter 12 bilbao, spain : WHERE PASSION
CAME TO LIFE 70 chapter 13 london, england : THE CITY OF ICONS 80 chapter 14 barcelona, spain : THE CITY OF
LIVING ART 86 chapter 15 madrid, spain : COMING FULL CIRCLE 87 chapter 16 stats: NUMBER OF MALLS, STORES &
SUPERMARKETS 88 chapter 16 stats: NUMBER OF MUSEUMS, COLUMNS, LIBRARIES, GALLERIES, THEATERS & UNIVERSITIES 89
chapter 16 stats: NUMBER OF PARKS, RIVERS & BEACHES 90 chapter 16 stats: NUMBER OF AIRPORTS & FLIGHTS 91
chapter 16 stats: NUMBER OF TRAINS, BUS STATIONS & BUSES 92 chapter 16 stats: NUMBER OF TRAINS, BUS STATIONS &
BUSES 93 chapter 16 stats: NUMBER OF FOUNTAINS & CANALS 94 chapter 16 stats: NUMBER OF MONUMENTS & STATUES. 95
chapter 16 stats: number of churCHES 96 chapter 16 stats: EUROTRIP STATS NUMBER OF HOUSES, HOTELS, BANKS,
TOWERS, CASTLES, PALACES, TEMPLES & ALTARS 97 chapter 16 stats:NUMBER OF BRIDGES, STADIUMS & ARCHES 98 chapter
16 stats: STATS TAKEN KM ON 99 chapter 17 SPENDINGS : lujos, trenes y buses 100 chapter 17 SPENDINGS :
souvenirs y atractivos turisticos 101 chapter 17 SPENDINGS : vuelos 102 chapter 17 SPENDINGS : alojamiento Y
TOTal 104 y en esta esta la carta

---
