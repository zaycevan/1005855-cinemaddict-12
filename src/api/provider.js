import FilmsModel from "../model/films.js";

const getSyncedFilms = (items) => {
  return items.filter(({success}) => success)
    .map(({payload}) => payload.film);
};

const createStoreStructure = (items) => {
  return items.reduce((acc, current) => {
    return Object.assign({}, acc, {
      [current.id]: current,
    });
  }, {});
};

export default class Provider {
  constructor(api, store) {
    this._api = api;
    this._store = store;
  }

  getFilms() {
    if (Provider.isOnline()) {
      return this._api.getFilms()
        .then((films) => {
          const items = createStoreStructure(films.map(FilmsModel.adaptToServer));
          this._store.setItems(items);
          return films;
        });
    }

    const storeFilms = Object.values(this._store.getItems());

    return Promise.resolve(storeFilms.map(FilmsModel.adaptToClient));
  }

  updateFilm(film) {
    if (Provider.isOnline()) {
      return this._api.updateFilm(film)
        .then((updatedFilm) => {
          this._store.setItem(updatedFilm.id, FilmsModel.adaptToServer(updatedFilm));
          return updatedFilm;
        });
    }

    this._store.setItem(film.id, FilmsModel.adaptToServer(Object.assign({}, film)));

    return Promise.resolve(film);
  }

  sync() {
    if (Provider.isOnline()) {
      const storeFilms = Object.values(this._store.getItems());

      return this._api.sync(storeFilms)
        .then((response) => {
          const updatedFilms = getSyncedFilms(response.updated);
          const items = createStoreStructure([...updatedFilms]);

          this._store.setItems(items);
        });
    }

    return Promise.reject(new Error(`Sync data failed`));
  }

  static isOnline() {
    return window.navigator.onLine;
  }
}
