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
var addDays = function (days) {
    var dat = new Date();
    var dayToHour = [9, 16, 16, 13, 16, 16, 9];
    dat.setDate(dat.getDate() + days);
    dat.setHours(dayToHour[dat.getDay()]);
    dat.setMinutes(0);
    return dat;
};

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
                              localStorage.setItem('alarms', JSON.stringify(lessons));
                              ul.removeChild(li);
                          });
                      });
                  });
                  deleteBtn.className += 'pull-right icon icon-close';
                  li.appendChild(deleteBtn);

                  // Select lesson button
                  var selectBtn = document.createElement('a');
                  selectBtn.appendChild(document.createTextNode(alarm.name));
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
            var lessons = localStorage.get('lessons') || [];
            var days = [3, 10];

            var lesson = {
              name: name,
              today: new Date(),
              days: days.map(addDays),
            };

            lessons.push(lesson);
            localStorage.set('lessons', lessons);
            name.value = '';
            phonon.navigator().changePage('home');
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
