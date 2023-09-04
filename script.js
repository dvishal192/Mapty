//'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const list = document.querySelector('.list');
const resetButton = document.querySelector('.reset');



//Start class WorkOut
class Workout {

    date = new Date();
    id = (Date.now() + '').slice(-10);

    clicks = 0;

    constructor(coords, distance, duration, type) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        this.type = type;
        this._setDescription()
    }


    _setDescription() {
        //         prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
          months[this.date.getMonth()]
        } ${this.date.getDate()}`;
    }

    click() {
        this.clicks++;
    }
}


//Running class as a child class of Workout -- Inheritance
class Running extends Workout {
    constructor(coords, distance, duration, cadence, type) {
        super(coords, distance, duration, type); //[lat,lng]
        this.cadence = cadence;
        this.calcPace();
    }

    calcPace() {
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;

    }
}


//Cylcing Class as a child class of Workout - Inheritance
class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain, type) {
        super(coords, distance, duration, type);
        this.elevationGain = elevationGain;
        this.calcSpeed();

    }
    calcSpeed() {
        this.speed = this.duration / (this.distance / 60);
        return this.speed;
    }
}




//Start Class App

class App {
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 15;


    constructor() {
        //Get user's position
        this._getPosition();

        //Get Data from local storage
        this._getLocalStorage();

        //Attach event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        resetButton.addEventListener('click', this._reset.bind(this));

    }



    //As name suggests, this._loadmap.bind(this) is binding the _getPosition() method to _loadmap function.
    _getPosition() {
        if (navigator.geolocation) {

            //Using the geolocation API
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert("Please allow location access for the site.");
            });
        }
    }



    _loadMap(position) {

        list.classList.remove('hidden');

        const {
            latitude,
            longitude,
            accuracy,
            speed
        } = position.coords;



        //Leaflet - Third Party Library


        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        L.marker([latitude, longitude]).addTo(this.#map)
            .bindPopup('Your current location.', {
                autoClose: true,
                closeOnClick: false
            })
            .openPopup();

        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });


    }



    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        list.classList.add('hidden');
        inputDistance.focus();
    }




    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }




    _hideForm() {

        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
    }




    _newWorkout(e) {

        const validInputs = (...inputs) => {
            inputs.every(inp => Number.isFinite(inp))
        }
        const allPositives = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();


        const {
            lat,
            lng
        } = this.#mapEvent.latlng;



        const cadence = parseFloat(inputCadence.value);
        const distance = parseFloat(inputDistance.value);
        const duration = parseFloat(inputDuration.value);
        const elevationGain = parseFloat(inputElevation.value);
        const type = inputType.value;
        let workout;


        if (type === 'running') {

            if (

                !validInputs(distance, duration, cadence),
                !allPositives(distance, duration, cadence)
            )
                return alert('Inputs have to be positive numbers!');

            workout = new Running([lat, lng], distance, duration, cadence, type);

        }

        if (type === 'cycling') {
            if (

                !validInputs(distance, duration),
                !allPositives(distance, duration)

            )

                return alert('Inputs have to be positive numbers!');

            workout = new Cycling([lat, lng], distance, duration, elevationGain, type);
        }


        //Add new workout object to workouts array
        this.#workouts.push(workout);


        //RenderWorkout on list
        this._renderWorkoutMarker(workout);

        //RenderWorkout on list
        this._renderWorkout(workout);


        this._hideForm();
        //Clear input field.


        //SetLocalStorage to all workouts.
        this._setLocalStorage();

    }




    _renderWorkoutMarker(workout) {

        const renderName = (workout.type)[0].toUpperCase() + workout.type.slice(1);

        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxwidth: 250,
            minwidth: 100,
            autoclose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
            autoClose: false
        })).setPopupContent(`${renderName}`).openPopup();
    }



    _renderWorkout(workout) {

        list.innerHTML = '';



        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️' } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

        if (workout.type == 'running') {
            html = html + `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        };

        if (workout.type == 'cycling') {
            html = html + `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> `;
        }

        form.insertAdjacentHTML('afterend', html);

    }


    _moveToPopup(e) {

        if (!this.#map) return;

        const workoutEl = e.target.closest('.workout');


        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 2,
            }
        })

    }


    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    };

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (data) {
            this.#workouts = data;
        } else {
            return;
        }

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    _reset(e) {
        e.preventDefault();
        alert("This action can't be reversed. You will lose your saved workouts. Are you sure you want to proceed?");
        localStorage.removeItem('workouts');
        location.reload();
    }

}






/*Note Point: Constructor method is created as soon as the class loads. Class loads as soon as scripts load */
//End Class App

//Calling the App Class


const app = new App();
