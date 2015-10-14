// settings - username and password of Microsoft Account that is the owner of the subscription
var userName = 'x@x.cz';
var password = 'x';

phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

var casper = require('casper').create({
    verbose: true,
    logLevel: 'debug',
    pageSettings: {
        webSecurityEnabled: false,
        // IE 11 user agent, just in case ... :)
        userAgent: 'Mozilla/5.0 ;Windows NT 6.1; WOW64; Trident/7.0; rv:11.0; like Gecko',
    }
});
var utils = require('utils');

// start with URL that should display billing history of the subscription it should redirect to
//  login form (for Microsoft Account, which seems to be the default variant of the login form)
//  because headless PhantomJS browser starts always with empty cache, no cookies, etc
casper.start(
    'https://portal.office.com/Commerce/BillOverview.aspx?year=2015&month=1'
);

casper.then(function() {
    // fill login form with Microsoft Account username and password
    this.fill('form', { 'login': userName, 'passwd': password }, true);
});



casper.then(function() {
    
    this.waitForSelector('#OrderRepeater_ctl01_OrderDetailsLink', function() {
        this.click('#OrderRepeater_ctl01_OrderDetailsLink');
    });

});

casper.then(function() {
    this.waitForSelector('a#InvoiceLink', function() {
        var url = this.getElementAttribute('a#InvoiceLink', 'href');
 

        casper.echo(url);


        this.then(function() {
            // debugging of downloaded files
            var pdfSaver = function(resource) {
                casper.echo('Resource received: ' + resource.url);
                casper.echo('- content-type: ' + resource.contentType);
                casper.echo('- stage: ' + resource.stage);

                // handle PDF download
                if (resource.stage == 'start' && resource.contentType == 'application/pdf') {
                    // get filename returned by server and use it
                    var fn = resource.headers.get('Content-Disposition').replace(/.*filename=(.*)/i, '$1');
                    // use standard CasperJS download method, because resource.received event does not
                    //  provide resource content; it's used just to determine the right moment to download
                    casper.download(resource.url, fn);
                }
            };

            casper.on('resource.received', pdfSaver);

            this.then(function() {
                this.thenOpen(url, function(response) {
                    this.wait(10000, function() {
                        casper.echo('Finished with this one: ' + response.url);
                    });
                });
            });
        });
    });
});


casper.run();
