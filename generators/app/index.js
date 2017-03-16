const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = Generator.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the legendary ' + chalk.red('generator-dfwtalent-api-cassandra') + ' generator!'
    ));

    let prompts = [];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
    }.bind(this));
  },

  writing: function () {
    this.fs.copy(this.templatePath('_editorconfig'), this.destinationPath('.editorconfig'));
    this.fs.copy(this.templatePath('_eslintrc'), this.destinationPath('.eslintrc'));
    this.fs.copy(this.templatePath('_gitignore'), this.destinationPath('.gitignore'));
    this.fs.copy(this.templatePath('_node-version'), this.destinationPath('.node-version'));
    this.fs.copy(this.templatePath('docker-compose.yml'), this.destinationPath('docker-compose.yml'));
    this.fs.copy(this.templatePath('Dockerfile'), this.destinationPath('Dockerfile'));
    this.fs.copy(this.templatePath('index.js'), this.destinationPath('index.js'));
    this.fs.copy(this.templatePath('LICENSE'), this.destinationPath('LICENSE'));
    this.fs.copyTpl(
      this.templatePath('package.json'),
      this.destinationPath('package.json'), {appname: this.props.appname}
    );
    this.fs.copy(this.templatePath('README.md'), this.destinationPath('README.md'));
    this.fs.copy(this.templatePath('yarn.lock'), this.destinationPath('yarn.lock'));
    this.fs.copy(this.templatePath('lib/**/*'), this.destinationPath('lib'));
    this.fs.copy(this.templatePath('routes/**/*'), this.destinationPath('routes'));
    this.fs.copy(this.templatePath('test/**/*'), this.destinationPath('test'));
  },

  install: function () {
    this.installDependencies({
      bower: false,
      npm: false,
      yarn: true
    });
  }
});
