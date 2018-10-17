var srcType = 'all',
    pc;

var url = window.location.href;
url = url.split('=');
url = url[1].split('&');
var base_url = decodeURIComponent(url[0]);

var getArticles;
var appendArticles;

var typingTimer;
var doneTyping;
var doneTypingInterval = 300;

$(function () {
    //https://developerblog.zendesk.com/making-modals-work-in-zaf-v2-251b7c940e58

    // Initialise the Zendesk JavaScript API client
    // https://developer.zendesk.com/apps/docs/apps-v2
    var client = ZAFClient.init();
    client.on('app.registered', init);

    function init() {
        pc = getParentClient(getGuid(window.location.hash));
    }

    function getGuid(paramString) {
        return paramString.split('=')[1];
    }

    function getParentClient(parent_guid) { //Definitely redundant but w/e
        return client.instance(parent_guid)
    }

    //actual modal functionality

    appendArticles = function (response) {
        for (let i = 0; i < response.count; i++) {
            let j = i + 1;

            let url = response.results["0"].html_url;
            let title = response.results[i].title;
            let body = response.results[i].body;

            let article = '<div class="card">' +
                '<div class="card-header row">' +
                '<div class="col-sm-10">' +
                '<div class="collapsed" id="heading' + j + '" data-toggle="collapse" data-target="#collapse' + j +
                '" aria-expanded="false" aria-controls="collapse"' + j + '">' +
                '<div class="row">' +
                '<div class="col-sm-2">#' + j + '</div>' +
                '<div class="col-sm-10">' +
                '<div class="postHeading" id="article_' + j + '">' + title + '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="col-sm-2">' +
                '<button type="button" class="btn copy-btn copy-link" id="copy-link-' + j + '">&#x1F517;</button>' +
                '<div class="float-right">' +
                '<button type="button" class="btn copy-btn copy-text" id="copy-txt-' + j + '">Copy</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div id="collapse' + j + '" class="collapse" aria-labelledby="heading' + j + '" data-parent="#accordion">' +
                '<a class="article-link" id="article_link_' + j + '" id="article_link_' + j + '" href="' + url + '"></a>' +
                '<div class="card-body" id="article_body_' + j + '">' +
                body +
                '</div>' +
                '</div>' +
                '</div>';
            $('#accordion').append(article);
        }
    }

    getArticles = function (url, isAppend) {
        var options = {
            url: url,
            type: 'GET',
            contentType: "application/json",
            cors: true
        };
        pc.request(options).then(
            function (response) {
                console.log(response);
                if(response.page === 1){
                    $('#accordion').empty();
                    if(response.count === 0){
                        $('#accordion').append('<div> No data found...</div>');
                    }
                }
                appendArticles(response);
                while(response.next_page){
                    getArticles(response.next_page, false);
                }
            });
    };

    doneTyping = function () {
        let data = $('#search').val();
        if (data) {
            data = base_url + "/api/v2/help_center/articles/search.json?query=" + data
            getArticles(data, false);
        }
    }

    $(document).on('click', '#src-all', function () {
        if (srcType === 'all') {

        } else {
            $('#src-' + srcType).addClass('btn-secondary').removeClass('btn-dark');
            $('#src-all').addClass('btn-dark').removeClass('btn-secondary');
            srcType = 'all';
        }
    });

    $(document).on('click', '#src-fav', function () {
        if (srcType === 'fav') {

        } else {
            $('#src-' + srcType).addClass('btn-secondary').removeClass('btn-dark');
            $('#src-fav').addClass('btn-dark').removeClass('btn-secondary');
            srcType = 'fav';
        }
    });

    $(document).on('click', '#src-my', function () {
        if (srcType === 'my') {

        } else {
            $('#src-' + srcType).addClass('btn-secondary').removeClass('btn-dark');
            $('#src-my').addClass('btn-dark').removeClass('btn-secondary');
            srcType = 'my';
        }
    });

    $(document).on('click', '.copy-link', function (e) {
        let id = e.target.id.split('-')[2];
        let link = $('#article_link_' + (id)).attr('href');
        let heading = $('#article_' + (id)).text();
        let data = '<p><a href="' + link + '">' + heading + '</a></p>';
        pc.get('comment.text').then(function (ticket_data) {
            pc.set('comment.text', ticket_data['comment.text'] + data);
            $('#copy-link-' + id).removeClass('copy-link').addClass('active').text("Copied!");
            setTimeout(function () {
                $('#copy-link-' + id).addClass('copy-link').removeClass('active').html("&#x1F517;");
            }, 1000);
        });
    });

    $(document).on('click', '.copy-text', function (e) {
        let id = e.target.id.split('-')[2];
        let body = $('#article_body_' + (id)).html();
        let data = '<p>' + body + '</p>';
        pc.get('comment.text').then(function (ticket_data) {
            pc.set('comment.text', ticket_data['comment.text'] + data);
            $('#copy-txt-' + id).addClass('active').text("Copied!");
            setTimeout(function () {
                $('#copy-txt-' + id).removeClass('active').text("Copy");
            }, 1000);
        });
    });

    $(document).on('keyup', '#search', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    $(document).on('keydown', '#search', function () {
        clearTimeout(typingTimer);
    });

});