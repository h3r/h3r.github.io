function loadFiles(pool, resources, options) {
    var options = options || {};
    if (!resources)
        throw "no resource defined to load";
    if (typeof resources == "string")
        resources = [resources];

    var onUpdate = options.onUpdate || function (oEvent) {
        if (oEvent.lengthComputable) {
            var percentComplete = oEvent.loaded / oEvent.total;
            console.log('percentComplete:', percentComplete + '%', oEvent);

        } else {// Unable to compute progress information since the total size is unknown
        }
    }

    var onLoad = options.onLoad || function (data) {
        console.log("The transfer is complete.");
        files[data.url] = data.response;
    }

    var onError = options.onError || function (data) {
        console.error("An error occurred while transferring the file.");
    }


    var complete = 0,
        error = 0,
        numResources = resources.length || 0;

    var resourceLoadingCheckout = function (state, data) {
        switch (state) {
            case "complete":
                complete++;
                onLoad(data);
                break;
            case "error":
                error++;
                onError(data);
                break;
            default:
                throw ("function called with unrecognised state: " + state);
        }
        if (complete + error == numResources) {
            console.log("The load transfer for all files is completed.")
            if (options.callback)
                options.callback(files);
        }
    }

    for (var r in resources) {
        var resource_url = resources[r];

        var oReq = new XMLHttpRequest();
        oReq.url = resource_url;
        oReq.open("GET", resource_url, true);

        oReq.onload = function (e) {
            var data = {
                response: this.response,
                url : this.url
            };

            var type = this.getResponseHeader("Content-Type");
            if (this.status != 200)
                return resourceLoadingCheckout('error', data);

            resourceLoadingCheckout('complete', data);
        }
        oReq.onError = function (error) {
            resourceLoadingCheckout('error', error);
        }

        oReq.send();
    }
}
