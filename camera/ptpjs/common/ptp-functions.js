
/****************************************************************************
 LICENSE: CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
 This is an original driver by Elijah Parker <mail@timelapseplus.com>
 It is free to use in other projects for non-commercial purposes.  For a
 commercial license and consulting, please contact mail@timelapseplus.com
*****************************************************************************/

exports.PTP_OC_Undefined              =  0x1000
exports.PTP_OC_GetDeviceInfo          =  0x1001
exports.PTP_OC_OpenSession            =  0x1002
exports.PTP_OC_CloseSession           =  0x1003
exports.PTP_OC_GetStorageIDs          =  0x1004
exports.PTP_OC_GetStorageInfo         =  0x1005
exports.PTP_OC_GetNumObjects          =  0x1006
exports.PTP_OC_GetObjectHandles       =  0x1007
exports.PTP_OC_GetObjectInfo          =  0x1008
exports.PTP_OC_GetObject              =  0x1009
exports.PTP_OC_GetThumb               =  0x100A
exports.PTP_OC_DeleteObject           =  0x100B
exports.PTP_OC_SendObjectInfo         =  0x100C
exports.PTP_OC_SendObject             =  0x100D
exports.PTP_OC_InitiateCapture        =  0x100E
exports.PTP_OC_FormatStore            =  0x100F
exports.PTP_OC_ResetDevice            =  0x1010
exports.PTP_OC_SelfTest               =  0x1011
exports.PTP_OC_SetObjectProtection    =  0x1012
exports.PTP_OC_PowerDown              =  0x1013
exports.PTP_OC_GetDevicePropDesc      =  0x1014
exports.PTP_OC_GetDevicePropValue     =  0x1015
exports.PTP_OC_SetDevicePropValue     =  0x1016
exports.PTP_OC_ResetDevicePropValue   =  0x1017
exports.PTP_OC_TerminateOpenCapture   =  0x1018
exports.PTP_OC_MoveObject             =  0x1019
exports.PTP_OC_CopyObject             =  0x101A
exports.PTP_OC_GetPartialObject       =  0x101B
exports.PTP_OC_InitiateOpenCapture    =  0x101C

exports.PTP_EC_Undefined			 = 0x4000
exports.PTP_EC_CancelTransaction	 = 0x4001
exports.PTP_EC_ObjectAdded			 = 0x4002
exports.PTP_EC_ObjectRemoved		 = 0x4003
exports.PTP_EC_StoreAdded			 = 0x4004
exports.PTP_EC_StoreRemoved			 = 0x4005
exports.PTP_EC_DevicePropChanged	 = 0x4006
exports.PTP_EC_ObjectInfoChanged	 = 0x4007
exports.PTP_EC_DeviceInfoChanged	 = 0x4008
exports.PTP_EC_RequestObjectTransfer = 0x4009
exports.PTP_EC_StoreFull			 = 0x400A
exports.PTP_EC_DeviceReset			 = 0x400B
exports.PTP_EC_StorageInfoChanged	 = 0x400C
exports.PTP_EC_CaptureComplete		 = 0x400D
exports.PTP_EC_UnreportedStatus		 = 0x400E 

var LOG_LEVEL = 0;

function _logD() {
	if(LOG_LEVEL > 0) return;
    if(arguments.length > 0) {
        arguments[0] = "PTP-FUJI: " + arguments[0];
    }
    console.log.apply(console, arguments);
}

exports.uint32buf = function(uint32) {
	var buf = new Buffer(4);
	buf.writeUInt32LE(uint32, 0);
	return buf;
}

exports.int32buf = function(int32) {
	var buf = new Buffer(4);
	buf.writeInt32LE(int32, 0);
	return buf;
}

exports.uint16buf = function(uint16) {
	var buf = new Buffer(2);
	buf.writeUInt16LE(uint16, 0);
	return buf;
}

exports.int16buf = function(int16) {
	var buf = new Buffer(2);
	buf.writeInt16LE(int16, 0);
	return buf;
}

exports.uint8buf = function(uint8) {
	var buf = new Buffer(1);
	buf.writeUInt8(uint8, 0);
	return buf;
}

exports.int8buf = function(int8) {
	var buf = new Buffer(1);
	buf.writeInt8(int8, 0);
	return buf;
}

exports.init = function(cam, callback) {
	exports.transaction(cam, exports.PTP_OC_OpenSession, [0x00000001], null, function(err, responseCode, data) {
		_logD("session open", err, exports.hex(responseCode), data);
		exports.transaction(cam, exports.PTP_OC_GetDeviceInfo, [], null, function(err, responseCode, data) {
			_logD("init complete", err, exports.hex(responseCode), data);
			var di = exports.parseDeviceInfo(data);
			_logD("device info:", di);
			//_logD("entering olympus pc mode...");
			callback && callback(err, di);
			//exports.transaction(cam, 0x1016, [0xD052], exports.uint16buf(1), function(err, responseCode, data) {
			//	_logD("olympus pc mode", err, responseCode);
			//	exports.transaction(cam, 0x9481, [0x3], null, function(err, responseCode, data)  {
			//		exports.transaction(cam, 0x9481, [0x6], null, function(err, responseCode, data) {
			//		});
			//	});
			//});
		});
	});
}

exports.setPropU8 = function(cam, prop, value, callback) {
	exports.transaction(cam, exports.PTP_OC_SetDevicePropValue, [prop], exports.uint8buf(value), function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode);
	});
}

exports.getPropU8 = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropValue, [prop], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data && data.readUInt8 && data.readUInt8(0));
	});
}

exports.setPropU16 = function(cam, prop, value, callback) {
	exports.transaction(cam, exports.PTP_OC_SetDevicePropValue, [prop], exports.uint16buf(value), function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode);
	});
}

exports.getPropU16 = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropValue, [prop], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data && data.readUInt16LE && data.readUInt16LE(0));
	});
}

exports.setProp16 = function(cam, prop, value, callback) {
	exports.transaction(cam, exports.PTP_OC_SetDevicePropValue, [prop], exports.int16buf(value), function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode);
	});
}

exports.getProp16 = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropValue, [prop], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data && data.readInt16LE && data.readInt16LE(0));
	});
}

exports.setPropU32 = function(cam, prop, value, callback) {
	exports.transaction(cam, exports.PTP_OC_SetDevicePropValue, [prop], exports.uint32buf(value), function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode);
	});
}

exports.getPropU32 = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropValue, [prop], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data && data.readUInt32LE && data.readUInt32LE(0));
	});
}

exports.setProp32 = function(cam, prop, value, callback) {
	exports.transaction(cam, exports.PTP_OC_SetDevicePropValue, [prop], exports.int32buf(value), function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode);
	});
}

exports.getProp32 = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropValue, [prop], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data && data.readInt32LE && data.readInt32LE(0));
	});
}

exports.listProp = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropDesc, [prop], null, function(err, responseCode, data) {
		var current = null;
		var list = [];
		var type = null;
		var writeable = null;
		var itemSize = 0;
		var itemFunction = 'readUInt8';
		var typeName = "unknown";

		var error = (err || responseCode == 0x2001 ? null : responseCode);
		//console.log("data", data);
		if(!error && data && data.length >= 4) {
			type = data.readUInt16LE(2);
			writeable = data.readUInt8(4);
			switch(type) {
				case 1: {
					itemSize = 1;
					itemFunction = 'readInt8';
					typeName = "int8";
					break;
				}
				case 2: {
					itemSize = 1;
					itemFunction = 'readUInt8';
					typeName = "uint8";
					break;
				}
				case 3: {
					itemSize = 2;
					itemFunction = 'readInt16LE';
					typeName = "int16";
					break;
				}
				case 4: {
					itemSize = 2;
					itemFunction = 'readUInt16LE';
					typeName = "uint16";
					break;
				}
				case 5: {
					itemSize = 4;
					itemFunction = 'readInt32LE';
					typeName = "int32";
					break;
				}
				case 6: {
					itemSize = 4;
					itemFunction = 'readUInt32LE';
					typeName = "uint32";
					break;
				}
				case 7: {
					itemSize = 8;
					itemFunction = 'readInt64LE';
					typeName = "int64";
					break;
				}
				case 8: {
					itemSize = 8;
					itemFunction = 'readUInt64LE';
					typeName = "uint64";
					break;
				}
				default: {
					itemSize = 0;
					break;
				}
			}
			if(itemSize) {
				var index = 5 + itemSize;
				if(data.length >= index + itemSize) {
					current = data[itemFunction](index);
					index += itemSize;
				}
				index += 3; // skip form type and length
				for(;;) {
					if(data.length >= index + itemSize) {
						list.push(data[itemFunction](index));
						index += itemSize;
					} else {
						break;
					}
				}
			}
			callback && callback(error, current, list, typeName);
		} else {
			callback && callback(error, null);
		}
	});
}

exports.getPropData = function(cam, prop, callback) {
	exports.transaction(cam, exports.PTP_OC_GetDevicePropValue, [prop], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data);
	});
}

exports.getObjectInfo = function(cam, objectId, callback) {
	exports.transaction(cam, exports.PTP_OC_GetObjectInfo, [objectId], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data && exports.parseObjectInfo(data));
	});
}

exports.getThumb = function(cam, objectId, callback) {
	exports.transaction(cam, exports.PTP_OC_GetThumb, [objectId], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data);
	});
}

exports.deleteObject = function(cam, objectId, callback) {
	exports.transaction(cam, exports.PTP_OC_DeleteObject, [objectId], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data);
	});
}

exports.getObject = function(cam, objectId, callback) {
	exports.transaction(cam, exports.PTP_OC_GetObject, [objectId], null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data);
	});
}

exports.getObjectHandles = function(cam, callback) {
	exports.transaction(cam, exports.PTP_OC_GetObjectHandles, [0xFFFFFFFF, 0x00000000], null, function(err, responseCode, data) {
		var error = (err || responseCode == 0x2001 ? null : responseCode);
		var handles = [];
		if(!error) {
            var objectCount = data.readUInt32LE(0);
            for(var i = 0; i < objectCount; i++) {
	            handles.push(data.readUInt32LE(4 + i * 4));
            }
		}
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, handles);
	});
}

exports.ptpCapture = function(cam, params, callback) {
	exports.transaction(cam, exports.PTP_OC_InitiateCapture, params, null, function(err, responseCode, data) {
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data);
	});
}

exports.initiateOpenCapture = function(cam, callback) {
	exports.transaction(cam, exports.PTP_OC_InitiateOpenCapture, [0x00000000, 0x00000000], null, function(err, responseCode, data) {
		var error = err || responseCode == 0x2001 ? null : responseCode;
		if(!error) cam._openCaptureTransactionId = cam.transactionId;
		callback && callback(error, data);
	});
}

exports.terminateOpenCapture = function(cam, callback) {
	if(!cam._openCaptureTransactionId) cam._openCaptureTransactionId = 0;
	exports.transaction(cam, exports.PTP_OC_TerminateOpenCapture, [cam._openCaptureTransactionId], null, function(err, responseCode, data) {
		var error = err || responseCode == 0x2001 ? null : responseCode;
		if(!error) cam._openCaptureTransactionId = 0;
		callback && callback(err || responseCode == 0x2001 ? null : responseCode, data);
	});
}

exports.hex = function(val) {
	if(val == null) return "null";
	return "0x" + val.toString(16);
}

exports.extractJpeg = function(data) {
	var maxSearch = data.length;
	//if(maxSearch > 6000000) maxSearch = 6000000; // limit to first 6MB

    _logD("searching for jpeg...", maxSearch);
    var jpegStart = null;//data.indexOf("FFD8FF", 0, "hex");
    var jpegEnd = maxSearch;//data.indexOf("FFD9", jpegStart, "hex");

    var jpegDetails = {};

    for(var i = 0; i < maxSearch; i++) {
    	if(data[i + 0] == 0xFF && data[i + 1] == 0xD8 && data[i + 2] == 0xFF) {
    		jpegStart = i;
    		break;
    	}
    }
    if(jpegStart === null) {
    	_logD("no jpeg found.");
    	return null;
    }

//    var off = jpegStart;
//    while(off < maxSearch) {
//        while(data[off] == 0xff) off++;
//        var mrkr = data[off];  off++;
//
//        if(mrkr == 0xd8 && data[off - 2] == 0xFF) {
//        	_logD("found start marker");
//        	jpegStart = off - 2;
//        	continue;    // SOI
//        }
//        if(mrkr == 0xd9 && data[off - 2] == 0xFF) {
//        	_logD("found end marker");
//        	jpegEnd = off;
//        	break;       // EOI
//        }
//        if(0xd0 <= mrkr && mrkr <= 0xd7) continue;
//        if(mrkr == 0x01) continue;    // TEM
//
//        var len = (data[off]<<8) | data[off+1];  off+=2;  
//
//        if(mrkr == 0xc0) {
//        	var details = {
//	            bpc : data[off],     // precission (bits per channel)
//	            w   : (data[off+1]<<8) | data[off+2],
//	            h   : (data[off+3]<<8) | data[off+4],
//	            cps : data[off+5]    // number of color components
//	        }
//        	_logD("jpeg details:", details);
//	        if(details.bpc = 8 && details.cps == 3) {
//	        	jpegDetails = details;
//	        	break;
//	        }
//	    }
//        off += len - 2;
//    }

	var depth = 0;
    for(var i = jpegStart + 3; i < maxSearch; i++) {
    	if(data[i + 0] == 0xFF && data[i + 1] == 0xD9) {
    		jpegEnd = i + 2;
    		if(depth <= 0) break;
    		depth--;
    	}
    	if(data[i + 0] == 0xFF && data[i + 1] == 0xD8 && data[i + 2] == 0xFF) {
    		//jpegStart = i;
    		depth++;
    	}
    }

    var jpegBuf = new Buffer(jpegEnd - jpegStart);
    data.copy(jpegBuf, 0, jpegStart, jpegEnd);

    _logD("found jpeg at", jpegStart, "size:", jpegBuf.length);
    return jpegBuf;
}

exports.parseObjectInfo = function(data) {
	if(data && data.length >= 50) {
		var oi = {
			storageId: data.readUInt32LE(0),
			objectFormat: data.readUInt16LE(4),
			protectionStatus: data.readUInt16LE(6),
			objectCompressedSize: data.readUInt32LE(8),
			thumbFormat: data.readUInt16LE(12),
			thumbCompressedSize: data.readUInt32LE(14),
			thumbPixWidth: data.readUInt32LE(18),
			thumbPixHeight: data.readUInt32LE(22),
			imagePixWidth: data.readUInt32LE(26),
			imagePixHeight: data.readUInt32LE(30),
			imageBitDepth: data.readUInt32LE(34),
			parentObject: data.readUInt32LE(38),
			associationType: data.readUInt16LE(42),
			associationDesc: data.readUInt16LE(44),
			sequenceNumber: data.readUInt32LE(46),
			filename: "",
		}
		if(data.length > 52) {
			oi.filename = data.toString('utf16le', 53);
			oi.filename = oi.filename.substring(0, oi.filename.indexOf('\0'));
		}
		return oi;
	}
	return {};
}

exports.parseEvent = function(data, callback) {
	var type = null;
	var event = null;
	var param1 = null;
	var param2 = null;
	var param3 = null;
	if(data.length >= 6) type = data.readUInt16LE(4);
	if(data.length >= 8) event = data.readUInt16LE(6);
	if(data.length >= 12 + 4*1) param1 = data.readInt32LE(12+4*0);
	if(data.length >= 12 + 4*2) param2 = data.readInt32LE(12+4*1);
	if(data.length >= 12 + 4*3) param3 = data.readInt32LE(12+4*2);
	callback && callback(type, event, param1, param2, param3);
}

function runTransaction(cam, opcode, params, data, callback) {
	if(!params) params = [];
	cam.transactionId++
	var length = 12 + 4 * params.length;
	var type = 1; // command
	var maxPacket = cam.ep.in.descriptor.wMaxPacketSize;
	var CHUNK_LIMIT = 6000000;

	// uint32 length (4) 0
	// uint16 type (2) 4
	// uint16 opcode (2) 6
	// uint32 transactionId (4) 8
	// uint32[4] params (optional) or data 12

	var buf = new Buffer(length);

	buf.writeUInt32LE(length, 0);
	buf.writeUInt16LE(type, 4);
	buf.writeUInt16LE(opcode, 6);
	buf.writeUInt32LE(cam.transactionId, 8);
	for(var i = 0; i < params.length; i++) {
		buf.writeUInt32LE(params[i], 12 + i * 4);
	}

	var send = function(buf, cb) {
		cam.ep.out.transfer(buf, function(err)  {
			_logD("sent", buf);
			if(data) {
				buf.writeUInt32LE(12 + data.length, 0); // overwrite length
				buf.writeUInt16LE(2, 4); // update type to 2 (data)
				var dbuf = Buffer.concat([buf.slice(0, 12), data]);
				data = null;
				send(dbuf, cb);
			} else {
				cb && cb(err);
			}
		});
	}

	var packetSize = function(ep, bytes) {
		return Math.ceil(bytes / maxPacket) * maxPacket;
	}

	var parseResponse = function(buf) {
		if(buf && buf.length == 12) {
			return buf.readUInt16LE(6);
		} else {
			return null;
		}
	}

	var receive = function(cb, rbuf) {
		_logD("reading 12 bytes...");
		cam.ep.in.transfer(packetSize(cam.ep.in, 12), function(err, data) {
			if(!err && data) {
				var rlen = data.readUInt32LE(0);
				var rtype = data.readUInt16LE(4);
				_logD("received packet type #", rtype, "total size:", rlen, "data length received:", data.length);
				if(rtype == 3) {
					var responseCode = parseResponse(data);
					_logD("completed transaction, response code", exports.hex(responseCode));
					if(rbuf) {
						rbuf = rbuf.slice(12); // strip header from data returned
						_logD("-> received", rbuf.length, "bytes: ", rbuf, "with err:", err);
					}
					cb && cb(err, responseCode, rbuf);
				} else {
					if(rlen > data.length) {
						var remainingBytes = rlen - data.length;
						var receivedIndex = 0;
						var bigData = new Buffer(rlen);
						data.copy(bigData, receivedIndex);
						receivedIndex += data.length;
						_logD("requesting more data:", remainingBytes);

						var fetchMore = function() {
							var chunk = rlen - receivedIndex;
							if(chunk > CHUNK_LIMIT) chunk = CHUNK_LIMIT;
							cam.ep.in.transfer(packetSize(cam.ep.in, chunk), function(err, data2) {
								if(!err && data2) {
									data2.copy(bigData, receivedIndex);
									receivedIndex += data2.length;
									_logD("received", data2.length, "bytes additional");
									if(receivedIndex < rlen) {
										fetchMore();
									} else {
										receive(cb, bigData);
									}
								} else {
									_logD("ERROR", err);
									receive(cb, data);
								}
							});
						}
						fetchMore();
					} else {
						receive(cb, data);
					}
				}
			} else {
				_logD("error reading:", err);
				cb && cb(err || "no data read");
			}
		});
	}

	send(buf, function(err) {
		if(err) return callback && callback(err);
		return receive(callback);
	});

}

function nextTransaction(cam) {
	cam.transactionRunning = true;
	if(cam.transactionQueue && cam.transactionQueue.length > 0) {
		var next = cam.transactionQueue.shift();
		runTransaction(next.cam, next.opcode, next.params, next.data, function() {
			next.callback && next.callback.apply(this, arguments);	
			nextTransaction(next.cam);
		});
	} else {
		cam.transactionRunning = false;
	}
}

exports.transaction = function(cam, opcode, params, data, callback) {
	if(!cam.transactionQueue) cam.transactionQueue = [];
	cam.transactionQueue.push({
		cam: cam,
		opcode: opcode,
		params: params,
		data: data,
		callback: callback
	});

	if(!cam.transactionRunning) {
		nextTransaction(cam);
	}
}

exports.parseUnicodeString = function(buf, offset) {
	var end = offset;
	for(var i = offset; i < buf.length; i += 2) {
		if(buf.readUInt16LE(i) == 0) {
			end = i;
			break;
		}
	}
	return buf.toString('utf16le', offset, end);
}

exports.parseDeviceInfo = function(buf) {
	var di = {};
	var offset = 12 + 8;
	di.vendorExtDesc = exports.parseUnicodeString(buf, offset);
	offset += di.vendorExtDesc.length * 2;
	offset += 3;
	di.operationsCount = buf.readUInt32LE(offset);
	offset += 4;
	di.operations = [];
	return di;
	for(var i = 0; i < di.operationsCount; i++) {
		di.operations.push(buf.readUInt16LE(offset).toString(16));
		offset += 2;
	}
	di.eventsCount = buf.readUInt32LE(offset);
	offset += 4;
	di.events = [];
	for(var i = 0; i < di.eventsCount; i++) {
		di.events.push(buf.readUInt16LE(offset).toString(16));
		offset += 2;
	}
	di.propertiesCount = buf.readUInt32LE(offset);
	offset += 4;
	di.properties = [];
	for(var i = 0; i < di.propertiesCount; i++) {
		di.properties.push(buf.readUInt16LE(offset).toString(16));
		offset += 2;
	}
	di.captureFormatsCount = buf.readUInt32LE(offset);
	offset += 4;
	di.captureFormats = [];
	for(var i = 0; i < di.captureFormatsCount; i++) {
		di.captureFormats.push(buf.readUInt16LE(offset).toString(16));
		offset += 2;
	}
	di.imageFormatsCount = buf.readUInt32LE(offset);
	offset += 4;
	di.imageFormats = [];
	for(var i = 0; i < di.imageFormatsCount; i++) {
		di.imageFormats.push(buf.readUInt16LE(offset).toString(16));
		offset += 2;
	}
	offset += 1;
	di.manufacturer = exports.parseUnicodeString(buf, offset);
	offset += di.manufacturer.length * 2;
	offset += 3;
	di.model = exports.parseUnicodeString(buf, offset);
	offset += di.model.length * 2;
	offset += 3;
	di.version = exports.parseUnicodeString(buf, offset);
	offset += di.version.length * 2;
	offset += 3;

	return di;
}
