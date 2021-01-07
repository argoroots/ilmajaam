$(function() {
    var lat = 59.3749
    var lon = 24.7098
    var dates = []
    var weekDays = [
        'pühapäev',
        'esmaspäev',
        'teisipäev',
        'kolmapäev',
        'neljapäev',
        'reede',
        'laupäev',
    ]

    var getServerTime = function () {
        return new Date($.ajax({ async: false }).getResponseHeader('Date'))
    }

    var getLocalTime = function () {
        return new Date()
    }

    var updateTime = function () {
        dt = getLocalTime()
        dtArr = [
            ('0' + dt.getHours()).substr(-2),
            ('0' + dt.getMinutes()).substr(-2),
            ('0' + dt.getSeconds()).substr(-2)
        ]
        $('#time').html(dtArr.join('.'))
    }
    updateTime()
    setInterval(updateTime, 1000)

    var getTimeInfo = function (date) {
        today = getLocalTime().getDate()
        dt = new Date(date)

        var result = {
            day: dt.getDate(),
            hour: dt.getHours()
        }

        if (result.day === today) {
            result.dayName = 'täna'
        } else if (result.day === today + 1) {
            result.dayName = 'homme'
        } else {
            result.dayName = weekDays[dt.getDay()]
        }

        return result
    }

    $.ajax({
        type: 'GET',
        url: 'https://s9bt0o347g.execute-api.eu-central-1.amazonaws.com/locationforecast/2.0/compact.json?lat=' + lat + '&lon=' + lon,
        dataType: 'json',
        success: function (json) {
            var timeseries = json.properties.timeseries

            for (let index = 0; index < timeseries.length; index++) {
                var time = timeseries[index];

                if (!time.data.next_1_hours && !time.data.next_6_hours) {
                    continue
                }

                var summary = time.data.next_1_hours ? time.data.next_1_hours.summary : time.data.next_6_hours.summary

                dates.push({
                    date: time.time,
                    symbolUrl: 'https://api.met.no/images/weathericons/svg/' + summary.symbol_code + '.svg',
                    temperature: time.data.instant.details.air_temperature,
                    windDirection: time.data.instant.details.wind_from_direction,
                    windSpeed: time.data.instant.details.wind_speed
                })
            }
        }
    }).done(function ( data ) {
        dates = _.orderBy(dates, ['date'])

        var row = []
        var day = 0
        var count = 0
        var firstHour = getTimeInfo(dates[0].date)

        _.forEach(dates, function(d, idx) {
            var currentHour = getTimeInfo(d.date)

            if (idx > 0 && firstHour.day !== currentHour.day && [2, 8, 14, 20].indexOf(currentHour.hour) === -1) { return }
            if (idx > 0 && firstHour.day === currentHour.day && firstHour.hour < 14 && [2, 8, 14, 20].indexOf(currentHour.hour) === -1) { return }
            // if (idx > 0 && firstHour.day === currentHour.day && firstHour.hour > 14 && firstHour.hour % 2 !== currentHour.hour % 2) { return }

            row.push('<div class="forecast-item">')
            row.push('<h2>')
            if (day !== currentHour.dayName) {
                day = currentHour.dayName
                row.push(currentHour.dayName)
            } else {
                row.push(' ')
            }
            row.push('</h2>')
            row.push('<img src="' + d.symbolUrl + '" alt="' + d.symbolTitle + '" data-date="' + d.date + '" />')
            row.push('<p>')
            row.push(('0' + currentHour.hour).substr(-2) + '.00')
            row.push('</p>')
            row.push('<h3>')
            row.push(Math.round(d.temperature))
            row.push('°')
            row.push('</h3>')
            row.push('<p>')
            row.push(Math.round(parseFloat(d.windSpeed)))
            row.push('<small> m/s</small>')
            row.push('</p>')
            row.push('<p style="-webkit-transform: rotate(' + (parseFloat(d.windDirection) + 90) + 'deg);">⟶</p>')
            row.push('</div>')

            count++
        })

        $('#temperature').html(dates[0].temperature + '°')
        $('#forecast').css('width', count * 150 + 'px')
        $('#forecast').html(row.join(''))
    })
})
