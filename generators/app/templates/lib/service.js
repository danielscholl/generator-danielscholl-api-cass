const Emitter = require('events').EventEmitter;
const util = require('util');
const bunyan = require('bunyan');
const bformat = require('bunyan-format');
const DbClient = require('./dbClient');
const Model = require('./models');
const dbSeed = require('./seed.json');

const formatted = bformat({ outputMode: 'short', color: true });
const log = bunyan.createLogger({
  name: 'Service',
  level: process.env.LOG_LEVEL || 'info',
  stream: formatted,
  serializers: bunyan.stdSerializers
});


const Service = function (config) {
  Emitter.call(this);
  let self = this;
  let continueWith = null;

  const db = new DbClient(config);
  let Table, closedb = null;


  // Create a Bad Result
  const sendError = function sendError (error, message) {
    const result = Model.Response({message: message});
    log.error(error, 'Service.sendError');

    if (continueWith) { continueWith(null, result); }
  };

  // Create an Okay Result
  const sendData = function (data) {
      const result = Model.Response({success: true, message: 'Success', data: data});
      log.debug(result, 'Service.sendData() received');

      if (continueWith) { continueWith(null, result); }
  };

  const listItem = function listItem ({pageIndex = 0, pageSize = 50} = {}) {
    const message = 'DB List Failure';

    let pageResult = Model.PageResult();
    pageResult.currentPage = pageIndex;
    pageResult.pageSize = pageSize;

    let filter = {
      $limit: pageSize,
      $skip: (pageSize) * pageIndex || 0
    };

    //Math.ceil -- Always rounds up
    pageResult.pages = Math.ceil(pageResult.count / filter.$limit);

    Table.find(filter, {raw: true, allow_filtering: true}, function (err, rows) {
      if (err) return self.emit('send-error', err, message);

      pageResult.count = rows.length;
      for (const row of rows) {
          pageResult.list.push(Model.Item(row));
      }
      return self.emit('send-data', pageResult);
    });

  };

  const createItem = function createItem (args) {
    const message = 'DB Create Failure';
    let dto = Model.Item(args);
    if (dto.errors() !== null) return self.emit('send-error', dto.errors(), message);

    let row = new Table(dto);
    row.saveAsync()
    .then(() => self.emit('send-data', Model.Item(row)))
    .catch(err => self.emit('send-error', err, message));
  };

  const readItem = function readItem (args) {
    const message = 'DB Read Failure';
    Table.findOneAsync(args)
    .then((result) => {
      if (!result) self.emit('send-error', {HTTP_STATUS: 404}, 'NOTFOUND');
      else self.emit('send-data', Model.Item(result));
    })
    .catch(err => self.emit('send-error', err, message));
  };

  const updateItem = function updateItem (args) {
    const message = 'DB Update Failure';
    const options = {if_exists: true};

    let dto = Model.Item(args);
    if (dto.errors() !== null) return self.emit('send-error', dto.errors(), message);

    Table.findOneAsync({id: args.id })
    .then((result) => {
      if (!result) return self.emit('send-error', {HTTP_STATUS: 404}, 'NOTFOUND');

      delete dto.id;
      Table.update({id: args.id}, dto.toJson(), options, function (err) {
        if (err) return self.emit('send-error', err, message);

        dto.id = args.id;
        return self.emit('send-data', dto);
      });
    })
    .catch(err => self.emit('send-error', err, message));
  };

  const deleteItem = function deleteItem ({id: id} = {}) {
    const message = 'DB Delete Failure';
    Table.findOneAsync({id: id })
    .then((result) => {
      if (!result) return self.emit('send-error', {HTTP_STATUS: 404}, 'NOTFOUND');
      result.delete(err => {
        if (err) return self.emit('send-error', err, message);

        return self.emit('send-data', id);
      });
    })
    .catch(err => self.emit('send-error', err, message));
  };

  const seedDB = function (eventHandler, args) {
    const message = 'DB Seed Failure';
    Table.findAsync({})
    .then((result) => {
      if (result.length > 0) return self.emit(eventHandler, args);
      log.debug('Service.openConnection()', 'Data Seeding Required');

      let count = 0;
      function raiseIfCompleted () {
        count++;
        if (count === dbSeed.length) return self.emit(eventHandler, args);
      }

      for (const o of dbSeed) {
        const item = new Model.Item(o);
        const model = new Table(item);
        log.trace('Service.seedData()', model.id);
        model.saveAsync()
        .then(raiseIfCompleted)
        .catch(err => self.emit('send-error', err, message));
      }
    }).catch(err => self.emit('send-error', err, message));
  };


  const openConnection = function openConnection (eventHandler, args) {
    const message = 'DB Connection Failure';
    log.debug('Service Connection Initiated');

    db.connect((err, db) => {
      if (err || db.instance.Item === undefined) return self.emit('send-error', err, message);
      closedb = db.close;
      Table = db.instance.Item;
      seedDB(eventHandler, args);
    });
  };

  /////////////////////////////////////////

  self.create = (input, done) => {
    log.debug({input: input}, 'Service.create()');
    continueWith = done;
    openConnection('create-item', input);
  };

  self.read = (input, done) => {
    log.debug({input: input}, 'Service.read()');
    continueWith = done;
    openConnection('read-item', input);
  };

  self.update = (input, done) => {
    log.debug({input: input}, 'Service.update()');
    continueWith = done;
    openConnection('update-item', input);
  };

  self.delete = (input, done) => {
    log.debug({input: input}, 'Service.delete()');
    continueWith = done;
    openConnection('delete-item', input);
  };

  self.list = (input, done) => {
    log.debug({input: input}, 'Service.list()');
    continueWith = done;
    openConnection('list-item', input);
  };

  self.close = () => {
    log.debug('DB Connection Close', 'Service.close()');
    if (closedb) { closedb(); }
  };


  // Event Wireup
  self.on('send-data', sendData);
  self.on('send-error', sendError);
  self.on('create-item', createItem);
  self.on('read-item', readItem);
  self.on('update-item', updateItem);
  self.on('delete-item', deleteItem);
  self.on('list-item', listItem);

  return self;
};

util.inherits(Service, Emitter);
module.exports = Service;
