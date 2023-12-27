import {
    getFormattedDate,
    firstLetterUpperCase,
    getWindDirection,
    formatUnixTimeTo24HourTimeString,
    hPaToMmHg,
    formatTime,
    splitForecastsForFiveDays,
    getFormattedTimestamp,
} from './utils.js'

export function setWeatherData({ weatherByCity, ForecastByCoord }) {
    console.log({ weatherByCity, ForecastByCoord })

    appStore.timezone = weatherByCity.timezone

    appStore.weatherInfo.city.geoFullName = `${weatherByCity.name}, ${weatherByCity.sys.country}`
    appStore.weatherInfo.city.name = weatherByCity.name
    appStore.weatherInfo.city.lat = weatherByCity.coord.lat
    appStore.weatherInfo.city.lot = weatherByCity.coord.lot

    appStore.weatherInfo.widget = {
        feelsLike: weatherByCity.main.feels_like,
        temp: weatherByCity.main.temp,
        tempMax: weatherByCity.main.temp_max,
        tempMin: weatherByCity.main.temp_min,
        currentDate: getFormattedDate(),
        main: weatherByCity.weather[0].main,
        description: firstLetterUpperCase(weatherByCity.weather[0].description),
        iconUrl: `https://openweathermap.org/img/wn/${weatherByCity.weather[0].icon}@2x.png`,
        backgroundUrl: `img/widget/${weatherByCity.weather[0].main}.jpg`,
    }

    appStore.weatherInfo.main = {
        windSpeed: weatherByCity.wind.speed,
        windDirection: getWindDirection(weatherByCity.wind.deg),
        clouds: weatherByCity.clouds.all,
        pressure: hPaToMmHg(weatherByCity.main.pressure),
        humidity: weatherByCity.main.humidity,
        sunrise: formatUnixTimeTo24HourTimeString(
            weatherByCity.sys.sunrise,
            appStore.timezone,
        ),
        sunset: formatUnixTimeTo24HourTimeString(
            weatherByCity.sys.sunset,
            appStore.timezone,
        ),
    }

    appStore.weatherInfo.forecast.list = ForecastByCoord.list.map(
        (forecastElem, index) => ({
            id: index,
            time: formatTime(forecastElem.dt_txt),
            iconUrl: `https://openweathermap.org/img/wn/${forecastElem.weather[0].icon}@2x.png`,
            temp: forecastElem.main.temp,
            windSpeed: forecastElem.wind.speed,
            windDirection: getWindDirection(weatherByCity.wind.deg),
            clouds: forecastElem.clouds.all,
            pressure: hPaToMmHg(forecastElem.main.pressure),
            humidity: forecastElem.main.humidity,
            tempMax: forecastElem.main.temp_max,
            tempMin: forecastElem.main.temp_min,
            // date: firstLetterUpperCase(
            //     getFormattedUnixTimestamp(forecastElem.dt)
            // ),
            description: firstLetterUpperCase(
                forecastElem.weather[0].description,
            ),
        }),
    )

    const findedTomorrowInfo = appStore.weatherInfo.forecast.list.find(
        (forecastElem) => forecastElem.time === '12:00',
    )

    if (findedTomorrowInfo) {
        appStore.weatherInfo.tomorrow = findedTomorrowInfo
    }
    const indexes = []

    appStore.weatherInfo.forecast.list.forEach((x, i) => {
        if (x.time === '0:00') {
            indexes.push(i)
        }
    })

    appStore.weatherInfo.tomorrow.list =
        appStore.weatherInfo.forecast.list.slice(indexes[0], indexes[1])
    appStore.weatherInfo.tomorrow.list

    appStore.weatherInfo.days = splitForecastsForFiveDays(
        appStore.weatherInfo.forecast.list,
    ).map((forecast, index) => ({
        id: index,
        main: (() => {
            const currentWeatherInfo = forecast.find(
                (item) => item.time === '12:00',
            )

            const dayDate = firstLetterUpperCase(
                getFormattedTimestamp(Date.now() + 86400000 * index),
            )

            return currentWeatherInfo
                ? { ...currentWeatherInfo, date: dayDate }
                : { ...forecast[0], date: dayDate }
        })(),
        list: forecast,
    }))

    // Устанавливаем мин Температуру. Без костыля никуда(
    for (let i = 0; i < appStore.weatherInfo.days.length; i++) {
        const day = appStore.weatherInfo.days[i]
        let temps = []

        if (i === 0) {
            const indexEndOfDay = day.list.findIndex(
                (forecastElem) => forecastElem.time === '0:00',
            )
            temps = day.list
                .slice(0, indexEndOfDay)
                .map((forecastElem) => forecastElem.tempMin)

            appStore.weatherInfo.widget.tempMin = Math.min(...temps)
            console.log()
        } else {
            temps = day.list.map((forecastElem) => forecastElem.tempMin)

            day.list.forEach((forecastElem, index) => {
                forecastElem.tempMin = Math.min(...temps)
            })
        }
    }
}
