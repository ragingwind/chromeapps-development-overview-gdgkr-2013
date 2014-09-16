(function() {
  $(document).ready(function() {

    // Initialize reveal
    Reveal.initialize({
      controls: false,
      progress: true,
      history: true,
      center: true,
      width: 1024,
      height: 768,
      theme: Reveal.getQueryHash().theme,
      transition: Reveal.getQueryHash().transition || 'default',
      dependencies: [
        { src: 'bower_components/reveal.js/lib/js/classList.js', condition: function() { return !document.body.classList; } },
        { src: 'plugin/markdown/showdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
        { src: 'plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
        { src: 'plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
        { src: 'plugin/zoom-js/zoom.js', async: true, condition: function() { return !!document.body.classList; } },
        { src: 'plugin/notes/notes.js', async: true, condition: function() { return !!document.body.classList; } }
      ]
    });

    // Initialize NotiServer
    function appendChat(msg) {
      var $chat = $('#chat-log');
      $chat.append(msg);
      $chat.animate({scrollTop: $chat.scrollTop() + $chat.height()});
    }

    // Register own log function
    NotiServer.log = function(msg, opt) {
      appendChat('<li class="log-chat"> > ' + msg + '</li>');
    }

    // Bind events for chat box keyup
    $('#chat-box').keyup(function(e){
      if(e.which === 13) {
        var chat = $('#chat-box').val();
        chat = chat.replace(/\n/, '');
        if (chat.length > 0) {
          appendChat('<li class="client-chat">' + chat + '</li>');
          NotiServer.notify(parseInt($('#chat-box').attr('socket-id')), chat);
        }
        $('#chat-box').val('');
        e.preventDefault();
      }
    });

    // Add events for each slides
    Reveal.addEventListener('slidechanged', function(event) {
      if (event.currentSlide && event.currentSlide.id === 'chat-demo') {
        var opt = {
          ip: '127.0.0.1',
          port: 9090
        };

        NotiServer.start(opt, function() {
          NotiServer.connect(opt, function(connectInfo) {
            $('#chat-box').prop('disabled', false);
            $('#chat-box').attr('socket-id', connectInfo.socketId);
          });
        });

      } else if (event.previousSlide && event.previousSlide.id === 'chat-demo') {
        NotiServer.stop();
      }
    });

    function changeBackground(event) {
      if (event.fragment.dataset.sectionBg) {
        var attr = event.fragment.dataset.sectionBg.split(':');
        if (attr.length >= 2) {
          $('#' + attr[0]).css('background-image', 'url(images/' + attr[1] + ')');
        }
      }
    }

    Reveal.addEventListener('fragmentshown', function( event ) {
      changeBackground(event);
    });

  });

})();
