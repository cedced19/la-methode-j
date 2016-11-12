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
var addDays = function (days) {
    var dat = new Date();
    dat.setDate(dat.getDate() + days);
    dat.setHours(dayToHour[dat.getDay()]);
    dat.setMinutes(0);
    return dat;
};
var numberOfMonths = function (date1, date2) {
    var number;
    number= (date2.getFullYear() - date1.getFullYear()) * 12;
    number-= date1.getMonth() + 1;
    number+= date2.getMonth() +1;
    return number <= 0 ? 0 : number;
}

phonon.navigator().on({
    page: 'home',
    content: 'home.html',
    preventClose: false,
    readyDelay: 0
}, function(activity) {

  activity.onReady(function() {
      var ul = document.getElementById('list');
      var lessons = JSON.parse(localStorage.getItem('lessons'));

      while (ul.firstChild) {
          ul.removeChild(ul.firstChild);
      }

      if (Array.isArray(lessons)) {
          document.getElementById('no-lesson').style.display = 'none';
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
                              lessons.splice(index, 1);
                              localStorage.setItem('lessons', JSON.stringify(lessons));
                              ul.removeChild(li);
                          });
                      });
                  });
                  deleteBtn.className += 'pull-right icon icon-close';
                  li.appendChild(deleteBtn);

                  // Select lesson button
                  var selectBtn = document.createElement('a');
                  selectBtn.appendChild(document.createTextNode(lesson.name));
                  selectBtn.on('click', function() {

                  });
                  selectBtn.className += 'padded-list';
                  li.appendChild(selectBtn);

                  ul.appendChild(li);
              });
          });
      } else {
          document.getElementById('no-lesson').style.display = 'block';
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
        var submitBtn = document.getElementById('submit-btn');

        submitBtn.on('click', function() {
            if (name.value == '') {
              return phonon.i18n().get(['empty_name', 'warning', 'ok'], function(values) {
                  phonon.alert(values['empty_name'], values['warning'], false, values['ok']);
              });
            }

            var lessons = JSON.parse(localStorage.getItem('lessons')) || [];
            var days = [3, 10];
            var nextJune = new Date();
            if (nextJune.getMonth() >= 5) {
              nextJune.setFullYear(nextJune.getFullYear() + 1);
            }
            nextJune.setMonth(5);
            nextJune.setDate(1);

            phonon.i18n().get(['give_end_date', 'information', 'ok'], function(values) {
                var alert = phonon.alert(values['give_end_date'], values['information'], false, values['ok']);
                alert.on('confirm', function () {
                    datePicker.show({
                      date: nextJune,
                      mode: 'date'
                    }, function(endDate){
                      for (var i = 0; i < numberOfMonths((new Date), endDate); i++) {
                        days.push((i+1) * 30);
                      }

                      endDate.setHours(dayToHour[endDate.getDay()]);
                      endDate.setMinutes(0);

                      var lesson = {
                        name: name.value,
                        today: new Date(),
                        days: days.map(addDays),
                        end: endDate
                      };

                      if (lesson.days[lesson.days.length-1] >  endDate) {
                        lesson.days.splice(lesson.days.length-1);
                      }
                      
                      lessons.push(lesson);
                      localStorage.setItem('lessons', JSON.stringify(lessons));
                      name.value = '';
                      phonon.navigator().changePage('home');
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
            phonon.i18n().get(['language_confirm', 'information', 'ok'], function(values) {
                phonon.alert(values.language_confirm, values.information, false, values.ok);
            });
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
