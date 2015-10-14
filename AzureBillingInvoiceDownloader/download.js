// settings - subscription ID
// https://account.windowsazure.com/Subscriptions/billinghistory?subscriptionId=8fa618a9-0902-403c-ac3c-69eba5c14651
var subscriptionId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
// settings - username and password of Microsoft Account that is the owner of the subscription
var userName = 'x@x.cz';
var password = 'x';

phantom.casperPath = 'node_modules/casperjs';
phantom.injectJs(phantom.casperPath + './bin/bootstrap.js');

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
    'https://account.windowsazure.com/Subscriptions/billinghistory?subscriptionId=' + subscriptionId
);

casper.then(function() {
    // fill login form with Microsoft Account username and password
    this.fill('form', { 'loginfmt': userName, 'passwd': password }, true);
});

casper.then(function() {
    this.wait(10000, function() {
        var content = this.evaluate(function() {
            var a = document.body.innerHTML;
            return a;
        });
       // this.echo(content);    

        var items = this.evaluate(function() {
            
            var links = document.querySelectorAll('ul.billing-list li');
            
            var s = "";
            aa = Array.prototype.map.call(links, function(e) {
                return e.innerHTML;
            });
            
            for (var key in links) {
                s = s + links[key].innerHTML;
            }
           // s = "";

            var arr = new Array();
            var i = 0;
            var len = links.length;
            
            for (; i < len;) {
                arr.push({
                    'name': links[i].querySelector('h2').innerText,
                    'invoiceDownloadUrl': links[i].querySelector('a').getAttribute('href'),
                    'usageDownloadUrl': '' });
                s = s + links[i].querySelector('h2').innerText;
                i += 3;
            };
            
            return arr;
            
        });        
        
        this.echo(items[0].invoiceDownloadUrl); 
        
        
        // use invoice download URL (from first A element in "row") from 2nd "row" (first "row" is
        //  current month, second "row" is first completely finished month)
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

            this.eachThen(items, function(response) {
                this.thenOpen(response.data.invoiceDownloadUrl, function(response) {
                    this.wait(10000, function() {
                        casper.echo('Finished with this one: ' + response.url);
                    });
                });
            });
        });
    });
});

/*
casper.then(function() {
    this.wait(7500, function() {
        // get list of date ranges and download URLs (represented visually on the page by "table",
        //  in HTML it's just UL/LI list)
        var links1 = document.querySelectorAll('li');
        var items = this.evaluate(function() {
            // this code will be evaluated in context of Azure Billing Portal page
            var links = document.querySelectorAll('ul.billing-list li');
            casper.echo(document.body);
            return Array.prototype.map.call(links, function(e) {
                return {
                    'name': e.querySelector('h2.name').innerText,
                    'invoiceDownloadUrl': e.querySelector('a:nth-of-type(1)').getAttribute('href'),
                    'usageDownloadUrl': e.querySelector('a:nth-of-type(2)').getAttribute('href'),
                };
            });
        });


        // use invoice download URL (from first A element in "row") from 2nd "row" (first "row" is
        //  current month, second "row" is first completely finished month)
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

            this.eachThen(items, function(response) {
                this.thenOpen(response.data.invoiceDownloadUrl, function(response) {
                    this.wait(10000, function() {
                        casper.echo('Finished with this one: ' + response.url);
                    });
                });
            });
            // this.open(items[1]['invoiceDownloadUrl'], function(response) {
            //     this.wait(10000, function() {
            //         casper.echo('Finished with this one: ' + response.url);
            //     });
            // });
        });
    });
});
*/

casper.run();
