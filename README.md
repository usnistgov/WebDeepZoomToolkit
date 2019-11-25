# Web DeepZoom Toolkit (WDZT)

An extensible JavaScript framework for analysis of deep zoom images on the web.
See it in action on https://isg.nist.gov.

All the functionalities are described in the [https://isg.nist.gov/deepzoomweb/help](documentation).

## Install WDZT from npm

```
npm install @wipp/wdzt
```

## Development

### Configuring

Import can be disabled or enabled by editing the config.js file and setting the `enableImport` property to true or false.


### Building

We use [Grunt](http://gruntjs.com/) for the building and testing scripts.
To get started you need to:

1. Install [Node.js](http://nodejs.org/).
1. Install Grunt via `npm install -g grunt-cli`.
1. Clone the WDZT repository.
1. Run `npm install` inside the cloned repository.
1. Install bower `npm install -g bower`.	
1. Run `bower install`.

You are now ready to build via `grunt`.
If you want to build and execute the tests type `grunt all`.
If you are having trouble running the test with Karma (errors/warning during the `(qunit) task` step), you can force the build to continue by running `grunt all --force`.

### Folders contents

The repository is organized as follow:
* / contains the readme, license, build files as well as html files for testing.
* /closure-compiler contains the google closure compiler jar
* /css contains all the project's css files
* /data contains small test datasets
* /images contains the icons used by WDZT
* /libs contains the project dependencies
* /src contains the source code divided in the following sub-folders:
    * /src/ for the core components
    * /src/logic for logic code potentially reused by multiple modules
    * /src/modules for the modules
    * /stc/widgets for UI widgets potentially reused across multiple modules
* /test contains the qUnit tests with one test file for each src file

### Modules development

To implement a new module, create a new file your-module.js under src/modules
and extend the module class.
Add your module in the debug.html file for easy debugging.
You should also create the corresponding unit tests under 
test/modules/your-module.js. Your test file should be included in both test.html
and test-debug.html.

Pull requests are appreciated!

## License

This software was developed at the National Institute of Standards and
Technology by employees of the Federal Government in the course of
their official duties. Pursuant to title 17 Section 105 of the United
States Code his software is not subject to copyright protection and is
in the public domain. This software is an experimental system. NIST assumes
no responsibility whatsoever for its use by other parties, and makes no
guarantees, expressed or implied, about its quality, reliability, or
any other characteristic. We would appreciate acknowledgement if the
software is used.
