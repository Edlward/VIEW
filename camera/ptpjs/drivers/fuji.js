
/****************************************************************************
 LICENSE: CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
 This is an original driver by Elijah Parker <mail@timelapseplus.com>
 It is free to use in other projects for non-commercial purposes.  For a
 commercial license and consulting, please contact mail@timelapseplus.com
*****************************************************************************/

var util = require('util');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var ptp = require('../common/ptp-functions.js');
var fs = require('fs');

var driver = new EventEmitter();

driver.name = "Fujifilm";

function _logD() {
    if(arguments.length > 0) {
        arguments[0] = "PTP-FUJI: " + arguments[0];
    }
    console.log.apply(console, arguments);
}

function _logE() {
    if(arguments.length > 0) {
        arguments[0] = "PTP-FUJI: " + arguments[0];
    }
    console.log.apply(console, arguments);
}

function objCopy(sourceObj, destObj) {
    if(!destObj) destObj = {};
    if(!sourceObj) return destObj;
    for(var k in sourceObj) {
        if(sourceObj.hasOwnProperty(k)) destObj[k] = sourceObj[k];
    }
    return destObj;
}

driver.supportedCameras = {
    '04cb:02cb': {
            name: "Fuji X-Pro2",
            supports: {
                shutter: true,
                aperture: true,
                iso: true,
                liveview: true,
                destination: true,
                focus: true,
            }
        },
    '04cb:02cd': {
            name: "Fuji X-T2",
            supports: {
                shutter: true,
                aperture: true,
                iso: true,
                liveview: true,
                destination: true,
                focus: true,
            }
        },
    '04cb:02d7': {
            name: "Fuji X-H1",
            supports: {
                shutter: true,
                aperture: true,
                iso: true,
                liveview: true,
                destination: true,
                focus: true,
            }
        },
    '04cb:02dd': {
            name: "Fuji X-T3",
            supports: {
                shutter: true,
                aperture: true,
                iso: true,
                liveview: true,
                destination: true,
                focus: true,
            }
        },
}

var properties = {
    'shutter': {
        name: 'shutter',
        category: 'exposure',
        setFunction: ptp.setPropU32,
        getFunction: ptp.getPropU32,
        listFunction: ptp.listProp,
        code: 0x500D,
        ev: true,
        values: [
            { name: "15m",     ev: -15,         code:  64000120 },
            { name: "8m",      ev: -14,         code:  64000090 },
            { name: "4m",      ev: -13,         code:  64000060 },
            { name: "2m",      ev: -12,         code:  64000030 },
            { name: "60s",     ev: -11,         code:  64000000 },
            { name: "50s",     ev: -11 - 2 / 3, code:  50796833 },
            { name: "40s",     ev: -11 - 1 / 3, code:  40317473 },
            { name: "30s",     ev: -11,         code:  32000000 },
            { name: "25s",     ev: -10 - 2 / 3, code:  25398416 },
            { name: "20s",     ev: -10 - 1 / 3, code:  20158736 },
            { name: "15s",     ev: -10,         code:  16000000 },
            { name: "13s",     ev: -9 - 3 / 3,  code:  12699208 },
            { name: "10s",     ev: -9 - 1 / 3,  code:  10079368 },
            { name: "8s",      ev: -9,          code:  8000000 },
            { name: "6s",      ev: -8 - 2 / 3,  code:  6349604 },
            { name: "5s",      ev: -8 - 1 / 3,  code:  5039684 },
            { name: "4s",      ev: -8,          code:  4000000 },
            { name: "3s",      ev: -7 - 2 / 3,  code:  3174802 },
            { name: "2.5s",    ev: -7 - 1 / 3,  code:  2519842 },
            { name: "2s",      ev: -7,          code:  2000000 },
            { name: "1.6s",    ev: -6 - 2 / 3,  code:  1587401 },
            { name: "1.3s",    ev: -6 - 1 / 3,  code:  1259921 },
            { name: "1s",      ev: -6,          code:  1000000 },
            { name: "0.8s",    ev: -5 - 2 / 3,  code:  793700 },
            { name: "0.6s",    ev: -5 - 1 / 3,  code:  629960 },
            { name: "1/2",     ev: -5,          code:  500000 },
            { name: "0.4s",    ev: -4 - 2 / 3,  code:  396850 },
            { name: "1/3",     ev: -4 - 1 / 3,  code:  314980 },
            { name: "1/4",     ev: -4,          code:  250000 },
            { name: "1/5",     ev: -3 - 2 / 3,  code:  198425 },
            { name: "1/6",     ev: -3 - 1 / 3,  code:  157490 },
            { name: "1/8",     ev: -3,          code:  125000 },
            { name: "1/10",    ev: -2 - 2 / 3,  code:  99212 },
            { name: "1/13",    ev: -2 - 1 / 3,  code:  78745 },
            { name: "1/15",    ev: -2,          code:  62500 },
            { name: "1/20",    ev: -1 - 2 / 3,  code:  49606 },
            { name: "1/25",    ev: -1 - 1 / 3,  code:  39372 },
            { name: "1/30",    ev: -1,          code:  31250 },
            { name: "1/40",    ev: 0 - 2 / 3,   code:  24803 },
            { name: "1/50",    ev: 0 - 1 / 3,   code:  19686 },
            { name: "1/60",    ev: 0,           code:  15625 },
            { name: "1/80",    ev: 0 + 1 / 3,   code:  12401 },
            { name: "1/100",   ev: 0 + 2 / 3,   code:  9843 },
            { name: "1/125",   ev: 1,           code:  7812 },
            { name: "1/160",   ev: 1 + 1 / 3,   code:  6200 },
            { name: "1/200",   ev: 1 + 2 / 3,   code:  4921 },
            { name: "1/250",   ev: 2,           code:  3906 },
            { name: "1/320",   ev: 2 + 1 / 3,   code:  3100 },
            { name: "1/400",   ev: 2 + 2 / 3,   code:  2460 },
            { name: "1/500",   ev: 3,           code:  1953 },
            { name: "1/640",   ev: 3 + 1 / 3,   code:  1550 },
            { name: "1/800",   ev: 3 + 2 / 3,   code:  1230 },
            { name: "1/1000",  ev: 4,           code:  976 },
            { name: "1/1250",  ev: 4 + 1 / 3,   code:  775 },
            { name: "1/1600",  ev: 4 + 2 / 3,   code:  615 },
            { name: "1/2000",  ev: 5,           code:  488 },
            { name: "1/2500",  ev: 5 + 1 / 3,   code:  387 },
            { name: "1/3200",  ev: 5 + 2 / 3,   code:  307 },
            { name: "1/4000",  ev: 6,           code:  244 },
            { name: "1/5000",  ev: 6 + 1 / 3,   code:  193 },
            { name: "1/6400",  ev: 6 + 2 / 3,   code:  153 },
            { name: "1/8000",  ev: 7,           code:  122 },
            { name: "1/10000", ev: 7 + 1 / 3,   code:  96 },
            { name: "1/13000", ev: 7 + 2 / 3,   code:  76 },
            { name: "1/16000", ev: 8,           code:  61 },
            { name: "1/20000", ev: 8 + 1 / 3,   code:  48 },
            { name: "1/25000", ev: 8 + 2 / 3,   code:  38 },
            { name: "1/32000", ev: 9,           code:  30 }
        ]
    },
    'aperture': {
        name: 'aperture',
        category: 'exposure',
        setFunction: ptp.setPropU16,
        getFunction: ptp.getPropU16,
        listFunction: ptp.listProp,
        code: 0x5007,
        ev: true,
        values: [
            { name: "1.0",      ev: -8,          code: 100  },
            { name: "1.1",      ev: -7 - 2 / 3,  code: 110  },
            { name: "1.2",      ev: -7 - 1 / 3,  code: 120  },
            { name: "1.4",      ev: -7,          code: 140  },
            { name: "1.6",      ev: -6 - 2 / 3,  code: 160  },
            { name: "1.8",      ev: -6 - 1 / 3,  code: 180  },
            { name: "2.0",      ev: -6,          code: 200  },
            { name: "2.2",      ev: -5 - 2 / 3,  code: 220  },
            { name: "2.5",      ev: -5 - 1 / 3,  code: 250  },
            { name: "2.8",      ev: -5,          code: 280  },
            { name: "3.2",      ev: -4 - 2 / 3,  code: 320  },
            { name: "3.6",      ev: -4 - 1 / 3,  code: 360  },
            { name: "4.0",      ev: -4,          code: 400  },
            { name: "4.5",      ev: -3 - 2 / 3,  code: 450  },
            { name: "5.0",      ev: -3 - 1 / 3,  code: 500  },
            { name: "5.6",      ev: -3,          code: 560  },
            { name: "6.3",      ev: -2 - 2 / 3,  code: 640  },
            { name: "7.1",      ev: -2 - 1 / 3,  code: 710  },
            { name: "8",        ev: -2,          code: 800  },
            { name: "9",        ev: -1 - 2 / 3,  code: 900  },
            { name: "10",       ev: -1 - 1 / 3,  code: 1000  },
            { name: "11",       ev: -1,          code: 1100  },
            { name: "13",       ev:  0 - 2 / 3,  code: 1300  },
            { name: "14",       ev:  0 - 1 / 3,  code: 1400  },
            { name: "16",       ev:  0,          code: 1600  },
            { name: "18",       ev:  0 + 1 / 3,  code: 1800  },
            { name: "20",       ev:  0 + 2 / 3,  code: 2000  },
            { name: "22",       ev:  1,          code: 2200  },
            { name: "25",       ev:  2 + 1 / 3,  code: 2500  },
            { name: "29",       ev:  2 + 2 / 3,  code: 2900  },
            { name: "32",       ev:  3,          code: 3200  },
            { name: "36",       ev:  3 + 1 / 3,  code: 3600  },
            { name: "42",       ev:  3 + 2 / 3,  code: 4200  },
            { name: "45",       ev:  4,          code: 4500  },
            { name: "50",       ev:  4 + 1 / 3,  code: 5000  },
            { name: "57",       ev:  4 + 2 / 3,  code: 5700  },
            { name: "64",       ev:  5,          code: 6400  }
        ]
    },
    'iso': {
        name: 'iso',
        category: 'exposure',
        setFunction: ptp.setProp32,
        getFunction: ptp.getProp32,
        listFunction: ptp.listProp,
        code: 0x500F,
        ev: true,
        values: [
            { name: "160",      ev: -2 / 3,      code: 160  },
            { name: "200",      ev: -1,          code: 200  },
            { name: "250",      ev: -1 - 1 / 3,  code: 250  },
            { name: "320",      ev: -1 - 2 / 3,  code: 320  },
            { name: "400",      ev: -2,          code: 400  },
            { name: "500",      ev: -2 - 1 / 3,  code: 500  },
            { name: "640",      ev: -2 - 2 / 3,  code: 640  },
            { name: "800",      ev: -3,          code: 800  },
            { name: "1000",     ev: -3 - 1 / 3,  code: 1000  },
            { name: "1250",     ev: -3 - 2 / 3,  code: 1250  },
            { name: "1600",     ev: -4,          code: 1600  },
            { name: "2000",     ev: -4 - 1 / 3,  code: 2000  },
            { name: "2500",     ev: -4 - 2 / 3,  code: 2500  },
            { name: "3200",     ev: -5,          code: 3200  },
            { name: "4000",     ev: -5 - 1 / 3,  code: 4000  },
            { name: "5000",     ev: -5 - 2 / 3,  code: 5000  },
            { name: "6400",     ev: -6,          code: 6400  },
            { name: "8000",     ev: -6 - 1 / 3,  code: 8000  },
            { name: "10000",    ev: -6 - 2 / 3,  code: 10000  },
            { name: "12800",    ev: -7,          code: 12800  },
            { name: "err-1",    ev: null,        code: -1  },
            { name: "err-2",    ev: null,        code: -2  },
            { name: "err-3",    ev: null,        code: -3  }
        ]
    },
    'format': {
        name: 'format',
        category: 'config',
        setFunction: ptp.setPropU16,
        getFunction: ptp.getPropU16,
        listFunction: ptp.listProp,
        code: 0xD018,
        ev: false,
        values: [
            { name: "RAW",               code: 1  },
            { name: "JPEG Fine",         code: 2  },
            { name: "JPEG Normal",       code: 3  },
            { name: "RAW + JPEG Fine",   code: 4  },
            { name: "RAW + JPEG Normal", code: 5  }
        ]
    },
    'destination': {
        name: 'destination',
        category: 'config',
        setFunction: ptp.setPropU16,
        getFunction: ptp.getPropU16,
        listFunction: ptp.listProp,
        code: 0xD20C,
        ev: false,
        values: [
            { name: "UNKNOWN1",          code: 1  },
            { name: "camera",            code: 2  },
            { name: "UNKNOWN2",          code: 3  },
            { name: "VIEW",              code: 4  },
        ]
    }
}

driver._error = function(camera, error) { // events received
    _logD("ERROR:", error);
};

driver._event = function(camera, data) { // events received
    _logD("EVENT:", data);
    ptp.parseEvent(data, function(type, event, param1, param2, param3) {
        if(event == ptp.PTP_EC_ObjectAdded) {
            _logD("object added:", param1);
        }
    });
};

driver.refresh = function(camera, callback) {
    var keys = [];
    for(var key in properties) {
        keys.push(key);
    }
    var lvMode = camera.status.liveview;
    async.series([
        function(cb){
            if(lvMode) driver.liveviewMode(camera, false, cb); else cb();
        },
        function(cb){
            var fetchNextProperty = function() {
                var key = keys.pop();
                if(key) {
                    properties[key].listFunction(camera._dev, properties[key].code, function(err, current, list, type) {
                        _logD(key, "type is", type);
                        if(!camera[properties[key].category]) camera[properties[key].category] = {};
                        if(!camera[properties[key].category][key]) camera[properties[key].category][key] = {};
                        var currentMapped = mapPropertyItem(current, properties[key].values);
                        if(currentMapped)_logD(key, "=", currentMapped.name);
                        camera[properties[key].category][key] = objCopy(currentMapped, {});
                        var mappedList = [];
                        for(var i = 0; i < list.length; i++) {
                            var mappedItem = mapPropertyItem(list[i], properties[key].values);
                            if(!mappedItem) {
                                _logE(key, "list item not found:", list[i]);
                            } else {
                                mappedList.push(mappedItem);
                            }
                        }
                        camera[properties[key].category][key].list = mappedList;
                        fetchNextProperty();
                    });
                } else {
                    //console.log(camera.exposure);
                    cb();
                }
            }
            fetchNextProperty();
        },
        function(cb){
            if(lvMode) driver.liveviewMode(camera, true, cb); else cb();
        },
    ], function(err) {
        return callback && callback(err);
    });
}

driver.init = function(camera, callback) {
    ptp.init(camera._dev, function(err, di) {
        async.series([
            function(cb){ptp.setPropU16(camera._dev, 0xd38c, 1, cb);}, // PC mode
            function(cb){ptp.setPropU16(camera._dev, 0xd207, 2, cb);},  // USB control
            function(cb){driver.refresh(camera, cb);}  // get settings
        ], function(err) {
            
            var shutterEv = camera.exposure.shutter.ev; 
            var capture = function() {

                driver.capture(camera, "", {}, function(err, thumb, filename, rawImage){
                    if(err) {
                        if(err != 0x2019) _logD("capture err result:", ptp.hex(err));
                    } else {
                        _logD("captured image:", filename);
                    }
                    var delay = 1000;
                    if(err == 0x2019) delay = 50; 
                    setTimeout(function() {
                        shutterEv++;
                        var set = function() {
                            driver.set(camera, 'shutter', shutterEv, function(err) {
                                if(err == 0x2019) return setTimeout(set, 100);
                                if(err) _logD("set error:", err);
                                capture();
                            });
                        }
                        set();
                    }, delay);
                });
            }
            //capture();
            //driver.refresh(camera);

            //ptp.listProp(camera._dev, 0x500D, function(err, current, list) {
            //    _logD("0x500D", current, list);
            //});

            callback && callback(err);
        });
    });
}

function mapPropertyItem(cameraValue, list) {
    for(var i = 0; i < list.length; i++) {
        if(cameraValue == list[i].code) return list[i];
    }
    return null;
}

driver.set = function(camera, param, value, callback) {
    var lvMode = camera.status.liveview;
    async.series([
        function(cb){
            if(lvMode) driver.liveviewMode(camera, false, cb); else cb();
        },
        function(cb){
            if(properties[param] && properties[param].setFunction) {
                var cameraValue = null;
                if(properties[param].ev && typeof value == "number") {
                    for(var i = 0; i < properties[param].values.length; i++) {
                        if(properties[param].values[i].ev == value) {
                            cameraValue = properties[param].values[i].code;
                            break;
                        }
                    }
                } else {
                    for(var i = 0; i < properties[param].values.length; i++) {
                        if(properties[param].values[i].name == value) {
                            cameraValue = properties[param].values[i].code;
                            break;
                        }
                    }
                }
                if(cameraValue !== null) {
                    _logD("setting", ptp.hex(properties[param].code), "to", cameraValue);
                    properties[param].setFunction(camera._dev, properties[param].code, cameraValue, function(err) {
                        if(!err) {
                            var newItem =  mapPropertyItem(cameraValue, properties[param].values);
                            for(var k in newItem) {
                                if(newItem.hasOwnProperty(k)) camera[properties[param].category][param][k] = newItem[k];
                            }
                            return cb(err);
                        } else {
                            return cb(err);
                        }
                    });
                } else {
                    _logE("set: unknown value", value, "for", param);
                    return cb("unknown value");
                }
            } else {
                _logE("set: unknown param", param);
                return cb("unknown param");
            }
        },
        function(cb){
            if(lvMode) driver.liveviewMode(camera, true, cb); else cb();
        },
    ], function(err) {
        return callback && callback(err);
    });
}

driver.get = function(camera, param, callback) {
    var lvMode = camera.status.liveview;
    async.series([
        function(cb){
            if(lvMode) driver.liveviewMode(camera, false, cb); else cb();
        },
        function(cb){
            if(properties[param] && properties[param].getFunction) {
                properties[param].getFunction(camera._dev, properties[param].code, function(err, data) {
                    if(!err) {
                        var newItem =  mapPropertyItem(data, properties[param].values);
                        if(newItem) {
                            for(var k in newItem) {
                                if(newItem.hasOwnProperty(k)) camera[properties[param].category][param][k] = newItem[k];
                            }
                        } else {
                            var list = camera[properties[param].category][param].list;
                            camera[properties[param].category][param] = {
                                list: list
                            }
                        }
                        return cb(err);
                    } else {
                        return cb(err);
                    }
                });
            } else {
                return cb("unknown param");
            }
        },
        function(cb){
            if(lvMode) driver.liveviewMode(camera, true, cb); else cb();
        },
    ], function(err) {
        return callback && callback(err, camera[properties[key].category][key]);
    });
}

function getImage(camera, timeout, callback) {
    var results = {
        thumb: null,
        filename: null,
        indexNumber: null,
        rawImage: null
    }

    var startTime = Date.now();

    var check = function() {
        if(Date.now() - startTime > timeout) {
            return callback && callback("timeout", results);
        }
        ptp.getPropData(camera._dev, 0xd212, function(err, data) { // wait if busy
            //console.log("data:", data);
            if(!err && data && data.length >= 4 && data.readUInt16LE(2) == 0xD20E) {
                var getHandles = function() {
                    if(Date.now() - startTime > timeout) {
                        return callback && callback("timeout", results);
                    }
                    ptp.getObjectHandles(camera._dev, function(err, handles) {
                        if(handles.length > 0) {
                            var objectId = handles[0];
                            var deleteRemaining = function() {
                                if(handles.length > 1) {
                                    var id = handles.pop();
                                    ptp.deleteObject(camera._dev, id, function(err) {
                                        deleteRemaining();
                                    });
                                }
                            }
                            ptp.getObjectInfo(camera._dev, objectId, function(err, oi) {
                                //console.log(oi);
                                var image = null;
                                results.filename = oi.filename;
                                results.indexNumber = objectId;
                                if(camera.thumbnail) {
                                    ptp.getThumb(camera._dev, objectId, function(err, jpeg) {
                                        ptp.deleteObject(camera._dev, objectId, function() {
                                            results.thumb = jpeg;
                                            callback && callback(err, results);
                                            deleteRemaining();
                                        });
                                    });
                                } else {
                                    ptp.getObject(camera._dev, objectId, function(err, image) {
                                        ptp.deleteObject(camera._dev, objectId, function() {
                                            results.thumb = ptp.extractJpeg(image);
                                            results.rawImage = image;
                                            callback && callback(err, results);
                                            deleteRemaining();
                                        });
                                    });
                                }
                            });
                        } else {
                            setTimeout(getHandles, 50);
                        }
                    });
                }
                getHandles();
            } else {
                setTimeout(check, 50);
            }
        });
    }
    check();
}

driver.capture = function(camera, target, options, callback, tries) {
    var targetValue = (!target || target == "camera") ? "camera" : "VIEW";
    camera.thumbnail = true;
    var results = {};
    var lvMode = camera.status.liveview;
    async.series([
        function(cb){
            if(lvMode) driver.liveviewMode(camera, false, cb); else cb();
        },
        function(cb){
            if(camera.config.destination.name == targetValue) cb(); else driver.set(camera, "destination", targetValue, cb);
        },
        function(cb){ptp.setPropU16(camera._dev, 0xd208, 0x0200, cb);},
        function(cb){ptp.ptpCapture(camera._dev, [0x0, 0x0], cb);},
        function(cb){
            var check = function() {
                ptp.getPropU16(camera._dev, 0xd209, function(err, data) { // wait if busy
                    if(data == 0x0001) {
                        check();
                    } else {
                        cb(err);
                    }
                });
            }
            check();
        },
        function(cb){ptp.setPropU16(camera._dev, 0xd208, 0x0304, cb);},
        function(cb){ptp.ptpCapture(camera._dev, [0x0, 0x0], cb);},
        function(cb){
            getImage(camera, 60000, function(err, imageResults) {
                results = imageResults;
                cb(err);
            });
        },
        function(cb){
            if(lvMode) driver.liveviewMode(camera, true, cb); else cb();
        },
    ], function(err, res) {
        if(err) _logE("capture error", ptp.hex(res), "at item", res.length);
        if(err == 0x2019 && tries < 3) {
            return driver.capture(camera, target, options, callback, tries + 1);
        }
        callback && callback(err, results.thumb, results.filename, results.rawImage);
    });
}

driver.captureHDR = function(camera, target, options, frames, stops, darkerOnly, callback) {

}

driver.liveviewMode = function(camera, enable, callback) {
    if(camera._dev._lvTimer) clearTimeout(camera._dev._lvTimer);
    if(camera.status.liveview != !!enable) {
        if(enable) {
            camera._dev._lvTimer = setTimeout(function(){
                driver.liveviewMode(camera, false);
            }, 5000);
            ptp.initiateOpenCapture(camera._dev, function(err) {
                if(!err) camera.status.liveview = true;
                callback && callback(err);
            });
        } else {
            ptp.terminateOpenCapture(camera._dev, function(err) {
                if(!err) camera.status.liveview = false;
                callback && callback(err);
            });
        }
    } else {
        callback && callback();
    }
}

driver.liveviewImage = function(camera, callback) {
    if(camera.status.liveview) {
        if(camera._dev._lvTimer) clearTimeout(camera._dev._lvTimer);
        camera._dev._lvTimer = setTimeout(function(){
            driver.liveviewMode(camera, false);
        }, 5000);
        ptp.getObject(camera._dev, 0x80000001, function(err, image) {
            ptp.deleteObject(camera._dev, 0x80000001);
            callback && callback(err, image);
        });
    } else {
        callback && callback("not enabled");
    }
}

driver.moveFocus = function(camera, steps, resolution, callback) {

}


module.exports = driver;
