set PATH=%~dp0node_modules\.bin;%PATH%
cd /d "%~dp0"

phantomjs download.js --credentials=credentials.json
@rem casperjs download.js --credentials=credentials.json --engine=slimerjs -debug=pageloading,netprogress,errors -jsconsole -load-images=false
