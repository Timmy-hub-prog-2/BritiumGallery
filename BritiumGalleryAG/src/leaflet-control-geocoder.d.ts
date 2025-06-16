declare namespace L {
  namespace Control {
    class Geocoder {
      static nominatim(): any;
      geocode(query: string, cb: Function): void;
    }
  }
}