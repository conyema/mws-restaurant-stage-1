/**  TODO: Create an Indexed Database for restaurant data **/
//if ('indexedDB' in window) {
  const dbPromise = idb.open('test14-DB', 3, (upgradeDB) => {
    switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
      case 1:
        upgradeDB.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        //const reviews = upgradeDB.createObjectStore('reviews', { autoIncrement: true });
        //reviews.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      case 2:
        upgradeDB.createObjectStore('offline-posts', { autoIncrement: true });
    }
  });
//}

//console.log(dbPromise);

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
    //return `https://chinfox.github.io/mws-restaurant-stage-1/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants.   -   From server if not in Indexed DB
   */
  static fetchRestaurants(callback) {
    //return dbPromise ? DBHelper.getRestaurantsFromIDB(callback) : DBHelper.getRestaurantsFromServer(callback);
    //idbKeyval.getAll('restaurants').then(restaurants => {
      //return restaurants.length ? callback(null, restaurants) : DBHelper.getRestaurantsFromServer(callback);
    //})
    idbKeyval.getAll('restaurants').then(restaurants => {
      if (restaurants.length) {
        callback(null, restaurants);
      } else {
        DBHelper.getRestaurantsFromServer(callback);  
      } 
    });
    //.catch(() => DBHelper.getRestaurantsFromServer(callback));    // fallback for Microsoft Edge
  }

  /**
   * Fetch all reviews.   -   From server if not in Indexed DB
   */
  static fetchReviews(callback) {
    //return dbPromise ? DBHelper.getReviewsFromIDB(callback) : DBHelper.getReviewsFromServer(callback);
    idbKeyval.getAll('reviews').then(reviews => {
      if (reviews.length) {
        callback(null, reviews);
      } else {
        DBHelper.getReviewsFromServer(callback);  
      } 
    });
    //.catch(() => DBHelper.getReviewsFromServer(callback));    // fallback for Microsoft Edge
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    //const url = `./images/${restaurant.photograph}`;
    //const small = url.replace('.jpg', '-small.jpg');
    //const normal = url.replace('.jpg', '-normal.jpg');
    //const large = url.replace('.jpg', '-normal_2x.jpg');
    const url = `./images/${restaurant.id}`;
    const small = `${url}-small.jpg`;
    const normal = `${url}-normal.jpg`;
    const large = `${url}-normal_2x.jpg`;
    return {small: small, normal: normal, large: large};
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }


  /**  Fetch Restaurant data from Server and store a copy of response in IDB  **/
  static getRestaurantsFromServer(callback) {
    let restaurant_URL = `${DBHelper.DATABASE_URL}/restaurants/`;
    fetch(restaurant_URL)
    .then(response => response.json()).then(restaurants => {
      restaurants.map(restaurant => {
        idbKeyval.set('restaurants', restaurant);
      });
      callback(null, restaurants);
    }).catch(error => callback(error, null));
  }

  /**  Fetch Reviews data from Server and store a copy of response in IDB   **/
  static getReviewsFromServer(callback) {
    let reviews_URL = `${DBHelper.DATABASE_URL}/reviews/`;
    fetch(reviews_URL).then(response => response.json())
    .then(reviews => {
      reviews.map(review => {
        idbKeyval.set('reviews', review);
      });
      callback(null, reviews);
    }).catch(error => callback(error, null));
  }
 
  /**  Fetch data from Server  **/
 /* static getFromServer(data, store, callback) {
    let restaurant_URL = `${DBHelper.DATABASE_URL}/${data}/`;
    fetch(restaurant_URL)
    .then(response => response.json()).then(restaurants => {
      restaurants.map(restaurant => {
        idbKeyval.set(store, restaurant, restaurant.id);
      });
      callback(null, restaurants);
    }).catch(error => callback(error, null));
  }*/

  /**  Fetch data from IDB   **/
  /*static getFromIDB(store, data, callback) {
    idbKeyval.getAll(store).then(data => {
      callback(null, restaurants);
    });
  }*/

  /*
  static getReviewsById(id, callback) {
    let reviews_URL = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
    fetch(reviews_URL).then(response => response.json())
    .then(reviews => {
      reviews.map(review => {
        idbKeyval.set('reviews', review);
      });
      callback(null, reviews);
    }).catch(error => callback(error, null));
  }*/
  
  /** Resend Posts made while offline **/
  static postOfflineData() {
    dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-posts', 'readwrite');
      const store = tx.objectStore('offline');
      return store.openCursor();
    })
    .then(function postData (cursor) {
      if (!cursor) {
        return;
      }
      console.log('cursor is at: ', cursor.key);

      const offlineKey = cursor.key;
      const url = cursor.value.url;
      const headers = cursor.value.headers;
      const method = cursor.value.method;
      const data = cursor.value.data;
      const flag = cursor.value.flag;
      const body = JSON.stringify(data);

      // Update Server with posts made while offline
      // then update the IndexedDB with data returned        
      fetch(url, {
        headers: headers,
        method: method,
        body: body
      })
      .then(response => response.json())
      .then(data => {
        console.log('Data from Server', data);

        // Delete the http request from offline-posts store
        dbPromise.then(db => {
          const tx = db.transaction('offline-posts', 'readwrite');
          tx.objectStore('offline-posts').delete(offline_key);
          return tx.complete;
        }).then(() => {
            // test if this is a review or favorite update
            if (review_key === undefined) {
              console.log('Favorite posted to server.');
            } else {
                // 2. Add new review record to reviews store
                // 3. Delete old review record from reviews store 
                dbPromise.then(db => {
                  const tx = db.transaction('reviews', 'readwrite');
                  return tx.objectStore('reviews').put(data)
                  .then(() => tx.objectStore('reviews').delete(review_key))
                  .then(() => {
                    console.log('tx complete reached.');
                    return tx.complete;
                  }).catch(err => {
                      tx.abort();
                      console.log('transaction error: tx aborted', err);
                    });
                })
                .then(() => console.log('review transaction success!'))
                .catch(err => console.log('reviews store error', err));
            }
          })
          .then(() => console.log('offline rec delete success!'))
          .catch(err => console.log('offline store error', err));
            
        }).catch(err => {
            console.log('Unable to connect', err);
            return;
          });
          return cursor.continue().then(postData);
    })
    .then(() => console.log('Done!'))
    .catch(err => console.log('Error opening cursor', err)); 
  }

  /**  Temporarily update review in IDB store and return its ID, if offline **/
  static updateReviewsOffline(val) {
    return idbKeyval.setData(val);
  }

  // Update review in IDB with data returned from Server
  static updateReviewsOnline(val) {
    return idbKeyval.set('reviews', val);
  }

  /**  Save requests made when offline or if fetch fails  **/
  static saveOfflinePost(url, headers, method, data, flag) {
    const request = {
      url: url,
      headers: headers,
      method: method,
      data: data,
      flag: flag
    };
    return idbKeyval.set('offline-posts', request);
  }

  /**  Mark a restaurant as a favorite  **/
  static setFavorite(restaurant, status) {
    const id = +restaurant.id;
    const url = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${status}`;
    const method = 'PUT';
    restaurant.is_favorite =  JSON.stringify(status);
    //restaurant.is_favorite = `"${status}"`;
    //restaurant.is_favorite = status;

    fetch(url, {
      method: method
    }).then(response => response.json())
    .then(data => idbKeyval.set('restaurants', data))
    .catch(err => {
      console.log(err);
      idbKeyval.set('restaurants', restaurant);
      DBHelper.saveOfflinePost(url, {}, method, '');
    });
  }
  /*
  static addFav(id) {
    let trueFav = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=true`;
    fetch(trueFav, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }
  
  static removeFav(id) {
    let falseFav = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=false`;
    fetch(falseFav, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }*/
}

  // Source: idb by Jake Archibald - https://www.npmjs.com/package/idb
  const idbKeyval = {
    get(key, store) {
      return dbPromise.then(db => {
        if(!db) return;
        return db.transaction(store)
          .objectStore(store).get(key);
      });
    },
    getAll(store) {
      return dbPromise.then(db => {
        if(!db) return;
        return db.transaction(store)
          .objectStore(store).getAll();
      });
    },
    set(store, val) {
      return dbPromise.then(db => {
        if(!db) return;
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(val);
        return tx.complete;
      });
    },
    /**  Save review to IDB store and return id **/
    setData(val) {
      return dbPromise.then(db => {
        if(!db) return;
        const tx = db.transaction('reviews', 'readwrite');
        const dbStore = tx.objectStore('reviews').put(val);
        tx.complete;
        return dbStore;
      });
    },
    delete(key, store) {
      return dbPromise.then(db => {
        if(!db) return;
        const tx = db.transaction('store', 'readwrite');
        tx.objectStore('store').delete(key);
        return tx.complete;
      });
    }
  };