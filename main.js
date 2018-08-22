"use strict";

(()=>{


    let normalise_server = server => {
        server = server.toLowerCase()
        if(!server.startsWith('https://') && !server.startsWith('http://')){
            server = 'https://' + server;
        }
        if(!server.endsWith('/')){
            server = server + '/';
        }
        return server;
    }

    let get_app_credentials = server => {
        server = normalise_server(server);

        try {
            let credentials = localStorage.getItem('app_credentials:'+server);
            credentials = JSON.parse(credentials);
            credentials['server'] = server;
            return Promise.resolve(credentials);
        } catch (e) {
            return register_application(server).then(creds => {
                creds['server'] = server;
                return creds;
            });
        }
    }

    let save_app_credentials = (server, credentials) => localStorage.setItem('app_credentials:'+server, JSON.stringify(credentials));

    let enforce_ok = response => {
        if(response.ok){
            return response;
        }
        throw 'not ok';
    }

    let register_application = server => {
        let endpoint = server + 'api/v1/apps';
        let body = new FormData()
        body.set('scopes', 'read write')
        body.set('client_name', 'Migration announcement tool')
        body.set('redirect_uris', ''+window.location)
        //body.set('website', 'fill this in later')

        let result = fetch(endpoint, {
            "method": "POST",
            "body": body
        }).then(enforce_ok).then(resp => resp.json());
        result.then(json => save_app_credentials(server, json));
        return result;
    }

    let log_in = server => {
        log_in_spinner(true);
        get_app_credentials(server).then(open_auth)
            .catch(() => {
                error('Something went wrong communicating with ' + server)
                log_in_spinner(false);
            });
    }

    let error = message => {
        let el = document.querySelector('.error');
        el.classList.toggle('not-shown', !message)
        el.textContent = message;
    }
    let unerror = () => error(false)


    let open_oauth = creds => {
        let server = creds['server'];
        // TODO
        //window.location = ;
    }

    let log_in_spinner = show_spinner => {
        let form = document.querySelector('#login-form');
        form.classList.toggle('loading', show_spinner);
        // TODO disable form inputs?
    }


    let init = ()=>{

        // TODO check if we're supposed to collect creds
        // and do the needful
        if(window.opener){
            console.log('oh! i am a baby')
        }

        let form = document.querySelector('#login-form');
        let instance_e = form.querySelector('input[name=instance]');
        form.addEventListener('submit', e => {
            e.preventDefault();
            log_in(instance_e.value)
        });
    }

    init();
})();
