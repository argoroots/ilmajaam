$(function() {
    var lat = 59.3748852
    var lon = 24.7099626
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

    var updateTime = function () {
        dt = new Date()
        dtArr = [
            ('0' + dt.getHours()).substr(-2),
            ('0' + dt.getMinutes()).substr(-2),
            ('0' + dt.getSeconds()).substr(-2)
        ]
        $('#time').html(dtArr.join('.'))
    }
    updateTime()
    setInterval(updateTime, 1000)

    var setNight = function () {
        var img = $(this)
        var dt = new Date(img.data('date'))

        jQuery.ajax({
            url: 'https://roots.entu.ee/metno/sunrise/1.1?lat=' + lat + '&lon=' + lon + '&date=' + img.data('date').substring(0, 10),
            dataType: 'xml',
            success: function(xml) {
                var sun = $(xml).find('sun')
                if (dt >= new Date(sun.attr('rise')) && dt <= new Date(sun.attr('set'))) {
                    img.attr('src', img.attr('src').replace('is_night=1', 'is_night=0'))
                }
            }
        })
    }

    var getTimeInfo = function (date) {
        today = new Date().getDate()
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
        url: 'https://roots.entu.ee/metno/locationforecast/1.9?lat=' + lat + '&lon=' + lon,
        dataType: 'xml',
        success: function (xml) {
            $(xml).find('temperature').each(function () {
                var time = $(this).parents('time')
                var symbol = $(xml).find('time[from="' + time.attr('from') + '"] symbol')

                if (symbol.attr('number')) {
                    dates.push({
                        date: time.attr('from'),
                        symbolTitle: symbol.attr('id'),
                        symbolUrl: symbol.attr('number') ? 'https://api.met.no/weatherapi/weathericon/1.1?symbol=' + symbol.attr('number') + '&is_night=1&content_type=image/svg%2Bxml' : null,
                        temperature: time.find('temperature').attr('value'),
                        windDirection: time.find('windDirection').attr('deg'),
                        windSpeed: time.find('windSpeed').attr('mps')
                    })
                }
            })
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
            row.push(d.temperature)
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

        $('.time img').each(setNight)
    })
})
