phonon.options({
    navigator: {
        defaultPage: 'home',
        animatePages: true,
        templateRootDirectory: 'views/',
        enableBrowserBackButton: true,
        useHash: true
    },
    i18n: {
        directory: 'langs/',
        localeFallback: 'en'
    }
});

var language = localStorage.getItem('language') || (window.navigator.userLanguage || window.navigator.language).split('-')[0];
phonon.updateLocale(language);

var dayToHour = [9, 16, 16, 13, 16, 16, 9];
var addDays = function(days) {
    var dat = new Date();
    dat.setDate(dat.getDate() + days);
    dat.setHours(dayToHour[dat.getDay()]);
    dat.setMinutes(0);
    return dat;
};
var numberOfDays = function(first, second) {
    return Math.round((second - first) / (1000 * 60 * 60 * 24));
}
var alertMessage = function(sentence, type) {
    phonon.i18n().get([sentence, type, 'ok'], function(values) {
        phonon.alert(values[sentence], values[type], false, values['ok']);
    });
};
var getPermission = function(cb) {
    cordova.plugins.permissions.hasPermission(cordova.plugins.permissions['WRITE_CALENDAR'], function(status) {
        if (!status.hasPermission) {
            cordova.plugins.permissions.requestPermission(cordova.plugins.permissions['WRITE_CALENDAR'], function(status) {
                if (!status.hasPermission) return alertMessage('not_allowed_to_write_calendar', 'error');
                cb();
            }, function() {
                alertMessage('not_allowed_to_write_calendar', 'error')
            });
        } else {
            cb();
        }
    }, null);
};
var randomString = function() {
    var chars = '0123456789'.split('');
    var str = '';
    for (var i = 0; i < 10; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
};
var containsNan = function(array) {
  for (var k in array) {
    if (isNaN(array[k])) {
      return true;
    }
  }
  return false;
};

phonon.navigator().on({
    page: 'home',
    content: 'home.html',
    preventClose: false,
    readyDelay: 0
}, function(activity) {

    activity.onReady(function() {
        var ul = document.getElementById('list');
        var noLessonDiv = document.getElementById('no-lesson');
        var lessons = JSON.parse(localStorage.getItem('lessons'));

        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }

        if (Array.isArray(lessons)) {
            noLessonDiv.style.display = 'none';
            ul.style.display = 'block';
            if (!lessons.length) {
                noLessonDiv.style.display = 'block';
                ul.style.display = 'none';
            }
            phonon.i18n().get('available_lesson', function(value) {
                var title = document.createElement('li');
                title.appendChild(document.createTextNode(value));
                title.className += 'divider';
                ul.appendChild(title);
                lessons.forEach(function(lesson, index) {
                    var li = document.createElement('li');

                    // Delete lesson button
                    var deleteBtn = document.createElement('a');
                    deleteBtn.on('click', function() {
                        phonon.i18n().get(['question_sure', 'warning', 'ok', 'cancel'], function(values) {
                            var confirm = phonon.confirm(values['question_sure'], values['warning'], true, values['ok'], values['cancel']);
                            confirm.on('confirm', function() {
                                cordova.plugins.notification.local.cancel(lesson.ids, function() {
                                    alertMessage('lesson_deleted', 'information');
                                });
                                lessons.splice(index, 1);
                                localStorage.setItem('lessons', JSON.stringify(lessons));
                                ul.removeChild(li);
                                if (!lessons.length) {
                                    noLessonDiv.style.display = 'block';
                                    ul.style.display = 'none';
                                }
                            });
                        });
                    });
                    deleteBtn.className += 'pull-right icon icon-close';
                    li.appendChild(deleteBtn);

                    // Select lesson button
                    var selectBtn = document.createElement('a');
                    selectBtn.appendChild(document.createTextNode(lesson.name));
                    selectBtn.className += 'padded-list';
                    li.appendChild(selectBtn);

                    ul.appendChild(li);
                });
            });
        } else {
            noLessonDiv.style.display = 'block';
            ul.style.display = 'none';
        }

    });
});

phonon.navigator().on({
    page: 'add-lesson',
    content: 'add-lesson.html',
    preventClose: false,
    readyDelay: 0
}, function(activity) {

    activity.onCreate(function() {
        var name = document.getElementById('name');
        var frequency = document.getElementById('frequency');
        var daysInput = document.getElementById('days');
        var submitBtn = document.getElementById('submit-btn');
        frequency.value = '30';

        var days = [3, 10];
        daysInput.value = days.join();
        submitBtn.on('click', function() {

            if (name.value == '') {
                return alertMessage('empty_name', 'warning');
            }

            days = daysInput.value.split(',').map(Number);
            if (containsNan(days)) {
                return alertMessage('bad_reminder_days', 'warning');
            }

            var lessons = JSON.parse(localStorage.getItem('lessons')) || [];

            var nextJune = new Date();
            if (nextJune.getMonth() >= 5) {
                nextJune.setFullYear(nextJune.getFullYear() + 1);
            }
            nextJune.setMonth(5);
            nextJune.setDate(1);

            if (frequency.value == '' || isNaN(frequency.value)) {
                return alertMessage('no_frequency_set', 'error');
            }

            getPermission(function() {
                phonon.i18n().get(['give_end_date', 'information', 'ok', 'learn'], function(values) {
                    Keyboard.hide();
                    var alert = phonon.alert(values['give_end_date'], values['information'], false, values['ok']);
                    alert.on('confirm', function() {

                        datePicker.show({
                            date: nextJune,
                            mode: 'date'
                        }, function(endDate) {

                            for (var i = +frequency.value; i <= numberOfDays((new Date), endDate); i = +i + +frequency.value) {
                                days.push(i);
                            }

                            endDate.setHours(dayToHour[endDate.getDay()]);
                            endDate.setMinutes(0);

                            var lesson = {
                                name: name.value,
                                today: new Date(),
                                days: days.map(addDays),
                                end: endDate,
                                ids: []
                            };

                            if (lesson.days[lesson.days.length - 1] > endDate) {
                                lesson.days.splice(lesson.days.length - 1);
                            }

                            name.value = '';

                            var title = values['learn'] + ' "' + lesson.name + '"';
                            lesson.days.forEach(function(date, index) {
                                var options = {
                                    start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0, 0),
                                    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0, 0),
                                    id: randomString()
                                };
                                window.plugins.calendar.createEventWithOptions(title, '', 'J' + days[index], options.start, options.end, {}, function() {}, function() {});
                                cordova.plugins.notification.local.schedule({
                                    title: title,
                                    text: 'J' + days[index],
                                    id: options.id,
                                    at: date,
                                    icon: 'file://res/icons/icon.png'
                                });
                                lesson.ids.push(options.id);
                            });

                            lessons.push(lesson);
                            localStorage.setItem('lessons', JSON.stringify(lessons));

                            phonon.navigator().changePage('home');
                        });
                    });
                });
            });
        });
    });

});

phonon.navigator().on({
    page: 'language',
    content: 'language.html',
    preventClose: false,
    readyDelay: 0
}, function(activity) {

    activity.onCreate(function() {
        var radios = document.querySelectorAll('input[name=language]');
        document.querySelector('#language-btn').on('click', function() {
            for (var i in radios) {
                if (radios[i].checked) {
                    localStorage.setItem('language', radios[i].value);
                    phonon.updateLocale(radios[i].value);
                    language = radios[i].value;
                    break;
                }
            }
            alertMessage('language_confirm', 'information');
        });
    });

    activity.onReady(function() {
        var radios = document.querySelectorAll('input[name=language]');
        for (var i in radios) {
            if (radios[i].value == language) {
                radios[i].checked = true;
                break;
            }
        }
    });
});

phonon.i18n().bind();
phonon.navigator().start();
