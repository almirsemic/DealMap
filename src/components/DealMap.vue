<template>
  <div>
    <div class="d-flex">
      <div class="mr-auto">
        <b-form-select
          v-model="selectedLocationType"
          :options="options"
        ></b-form-select>
      </div>
      <b-form-file
        type="file"
        v-model="file"
        @input="previewFiles"
        accept="application/JSON"
      />
    </div>
    <div>
      <GmapMap
        :center="center"
        :zoom="2"
        map-type-id="terrain"
        class="w-100"
        style="height: 70vh"
        ref="mapRef"
      >
        <GmapMarker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          :clickable="true"
          @click="center = m.position"
          :icon="m.icon"
        />
      </GmapMap>
    </div>
    <div>
      <b-badge
        class="mx-2"
        v-for="location in Object.keys(this.colors)"
        :key="location"
        :style="'background-color:' + colors[location]"
        >{{ deals[location] }} {{ location }}</b-badge
      >
    </div>
    <div class="loaded-wrapper" v-if="loadingSpinner">
      <div class="lds-ripple"><div></div><div></div></div>
    </div>
  </div>
</template>

<script>
import Countries from "../utils/Countries";

function getCountryFromAddressComponents(addrComponents) {
  for (var i = 0; i < addrComponents.length; i++) {
    if (addrComponents[i].types[0] == "country") {
      return addrComponents[i].short_name;
    }
    if (addrComponents[i].types.length == 2) {
      if (addrComponents[i].types[0] == "political") {
        return addrComponents[i].short_name;
      }
    }
  }
  return false;
}

function generateRandomHexColor() {
  return "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
}

function getColorsForLocation(data, type) {
  const colors = {};
  data.forEach((marker) => {
    if (!colors[marker[type]]) {
      colors[marker[type]] = generateRandomHexColor();
    }
  });
  return colors;
}

const ICON_PATH =
  "M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0";

export default {
  name: "DealMap",
  computed: {
    deals() {
      switch (this.selectedLocationType) {
        case "city":
          return this.cityDeals;
        case "country":
          return this.countryDeals;
        case "continent":
          return this.continentDeals;
        default:
          return {};
      }
    },
    continentColors() {
      return getColorsForLocation(this.formattedData, "continent");
    },
    countryColors() {
      return getColorsForLocation(this.formattedData, "country");
    },
    cityColors() {
      return getColorsForLocation(this.formattedData, "city");
    },
    colors() {
      if (this.selectedLocationType === "continent") {
        return this.continentColors;
      } else if (this.selectedLocationType === "country") {
        return this.countryColors;
      } else if (this.selectedLocationType === "city") {
        return this.cityColors;
      }
      return {};
    },
    markers() {
      const map = {};
      return this.formattedData.map((deal) => {
        if (!map[deal[this.selectedLocationType]]) {
          map[deal[this.selectedLocationType]] = {
            ...deal.position,
            label: deal[this.selectedLocationType],
          };
        }
        let obj = {
          position: map[deal[this.selectedLocationType]],
          icon: {
            path: ICON_PATH,
            fillColor: this.colors[deal[this.selectedLocationType]],
            fillOpacity: 1,
            scale: 0.1,
          },
        };
        return obj;
      });
    },
  },
  methods: {
    previewFiles() {
      const reader = new FileReader();
      reader.onerror = (err) => console.log(err);
      reader.readAsText(this.file);
      reader.onload = (res) => {
        this.onFileLoaded(JSON.parse(res.target.result));
      };
    },
    async onFileLoaded(data) {
      this.loadingSpinner = true;
      const formattedData = [];
      // eslint-disable-next-line no-undef
      const geocoder = new google.maps.Geocoder();
      for (let deal of data) {
        let geocoderResult;
        geocoderResult = await geocoder.geocode({
          componentRestrictions: {
            country: deal.Country,
            locality: deal.City,
          },
        });
        if (geocoderResult) {
          let country = getCountryFromAddressComponents(
            geocoderResult.results[0].address_components
          );
          let obj = {
            continent: Countries[country].continent,
            country,
            city: deal.City,
            deals: deal["No.Deals"],
            position: {
              lat: geocoderResult.results[0].geometry.location.lat(),
              lng: geocoderResult.results[0].geometry.location.lng(),
            },
          };
          formattedData.push(obj);
        }
        await new Promise((resolve) =>
          setTimeout(() => {
            resolve();
          }, 500)
        );
      }
      this.continentDeals = {};
      this.countryDeals = {};
      this.cityDeals = {};
      formattedData.forEach((item) => {
        this.continentDeals[item.continent] =
          (this.continentDeals[item.continent]
            ? this.continentDeals[item.continent]
            : 0) + Number(item.deals);
        this.countryDeals[item.country] =
          (this.countryDeals[item.country]
            ? this.countryDeals[item.country]
            : 0) + Number(item.deals);
        this.cityDeals[item.city] =
          (this.cityDeals[item.city] ? this.cityDeals[item.city] : 0) +
          Number(item.deals);
      });
      this.formattedData = formattedData;
      this.loadingSpinner = false;
    },
  },
  data() {
    return {
      selectedLocationType: "continent",
      formattedData: [],
      continentDeals: {},
      countryDeals: {},
      cityDeals: {},
      options: [
        { value: "continent", text: "Continent" },
        { value: "country", text: "Country" },
        { value: "city", text: "City" },
      ],
      file: null,
      center: { lat: 0, lng: 0 },
      loadingSpinner: false
    };
  },
};
</script>

<style scoped>
.lds-ripple {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ripple div {
  position: absolute;
  border: 4px solid #fff;
  opacity: 1;
  border-radius: 50%;
  animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}
.lds-ripple div:nth-child(2) {
  animation-delay: -0.5s;
}
@keyframes lds-ripple {
  0% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  4.9% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 0;
  }
  5% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 0px;
    left: 0px;
    width: 72px;
    height: 72px;
    opacity: 0;
  }
}
.loaded-wrapper{
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: #242f3f;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}
</style>
