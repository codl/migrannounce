"use strict";

(()=>{

    let normalise_server = server => {
        server = server.toLowerCase()
        if(!server.startsWith('https://') && !server.startsWith('http://')){
            server = 'https://' + server;
        }
        server = new URL(server);
        server.hash = '';
        server.search = '';
        if(!server.port){
            if(server.protocol == 'https:'){
                server.port = 443
            }
            if(server.protocol == 'http:'){
                server.port = 80
            }
        }
        return server.href;
    }

    let get_app_credentials = server => {
        try {
            let credentials = localStorage.getItem('app_credentials:'+server);
            credentials = JSON.parse(credentials);
            credentials['server'] = server;
            return Promise.resolve(credentials);
        } catch (e) {
            console.error(e);
            return register_application(server);
        }
    }

    let save_app_credentials = (server, credentials) => localStorage.setItem('app_credentials:'+server, JSON.stringify(credentials));

    let enforce_ok = response => {
        if(response.ok){
            return response;
        }
        throw 'not ok';
    }

    let redirect_uri_for = server => {
        let uri = new URL(window.location);
        let query = new URLSearchParams({"server": server});
        uri.search = query;
        uri.hash = '';
        return uri.href;
    }

    let register_application = server => {
        let endpoint = new URL(server)
        endpoint.pathname = '/api/v1/apps';
        let body = new URLSearchParams()
        body.set('scopes', 'read write')
        body.set('client_name', 'Migrannouncement tool')
        body.set('redirect_uris', redirect_uri_for(server))
        //body.set('website', 'fill this in later')

        let result = fetch(endpoint, {
            "method": "POST",
            "body": body,
            "headers":
                {'content-type': 'application/x-www-form-urlencoded'},
        }).then(enforce_ok).then(resp => resp.json());
        result.then(json => save_app_credentials(server, json));
        return result;
    }

    let log_in = server => {
        log_in_spinner(true);
        let nserver = normalise_server(server);
        get_app_credentials(nserver).then(creds => navigate_to_oauth(nserver, creds['client_id']))
            .catch((e) => {
                error('Something went wrong communicating with ' + server + '. Try again?')
                log_in_spinner(false);
                console.error(e);
            });
    }

    let error = message => {
        let el = document.querySelector('.error');
        el.classList.toggle('not-shown', !message)
        el.textContent = message;
    }
    let unerror = () => error(false)


    let navigate_to_oauth = (server, client_id) => {
        let url = new URL(server);
        url.pathname = '/oauth/authorize'
        url.search = new URLSearchParams({
            "client_id": client_id,
            "redirect_uri": redirect_uri_for(server),
            "response_type": "code",
            "scopes": "read write",
        })
        window.location = url.href
    }

    let log_in_spinner = show_spinner => {
        let form = document.querySelector('#login-form');
        form.classList.toggle('loading', !!show_spinner);

        let inputs = Array.from(document.querySelectorAll('#login-form input'));
        for(let input of inputs){
            input.disabled = !!show_spinner;
        }
    }

    async function collect_user_credentials(code, server) {
        let app_creds = await get_app_credentials(server);

        let url = new URL(server);
        url.pathname = '/oauth/token';

        let body = new URLSearchParams()
        body.set('client_id', app_creds['client_id'])
        body.set('client_secret', app_creds['client_secret'])
        body.set('code', code)
        body.set('grant_type', 'authorization_code')
        body.set('redirect_uri', redirect_uri_for(server))

        return fetch(url, {
            method: 'POST',
            body: body,
            headers:
                {'content-type': 'application/x-www-form-urlencoded'}
        })
            .then(enforce_ok)
            .then(resp => resp.json())
            .then(json => json['access_token'])
    }

    let remove_query_string = () => {
        let newurl = new URL(window.location);
        newurl.hash = ''
        newurl.search = ''
        history.replaceState(null, '', newurl);

    }


    let init = ()=>{
        let form = document.querySelector('#login-form');
        let instance_e = form.querySelector('input[name=instance]');
        form.addEventListener('submit', e => {
            e.preventDefault();
            log_in(instance_e.value)
        });

        let params = new URLSearchParams(document.location.search);
        if(params.has('code') && params.has('server')){
            log_in_spinner(true);
            // time to collect credentials
            let credentials_p = collect_user_credentials(params.get('code'), params.get('server'))
            credentials_p
                .then(init_logged_in_ui)
                .then(() => log_in_spinner(false))

                .catch((e) => {
                    console.error(e);
                    error("Something went wrong. Try again?");
                    log_in_spinner(false);
                });

            credentials_p.then(remove_query_string);

        }

    }

    let init_logged_in_ui = async response => {
        console.log(response)
    }

    init();
})();
