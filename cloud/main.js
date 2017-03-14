
Parse.Cloud.define('hello', function(req, res) {
  res.success('hello');
});

Parse.Cloud.define('conference', function(req, res) {
  res.success('conference cloud code testing');
});

Parse.Cloud.define('push', function(req, res) {
  Parse.Cloud.useMasterKey();
  var params = req.params;
  console.log('params: ', params);
  //var queryIOS = new Parse.Query(Parse.Installation);
  //queryIOS.equalTo('deviceType', 'ios');
  //
  //var queryAndroid = new Parse.Query(Parse.Installation);
  //queryAndroid.equalTo('deviceType', 'android');
  //
  //var queryBoth = new Parse.Query(Parse.Installation);
  //queryBoth.containedIn('deviceType', ['ios', 'android']);

  var queryDevices = new Parse.Query(Parse.Installation);
  queryDevices.containedIn('deviceType', params.deviceTypes);
  queryDevices.containedIn('channels', params.channels);
  queryDevices.equalTo('deviceToken', '7b5eeaca9cf3f80c1a4c128d2ef16f179f4dfb5e89c7cdda7224f6001a61e8cf');


  var expirationTime = params.expirationTimeInMilliseconds;
  var pushContent = params.pushContent;

  var pushObject = {
    where: queryDevices, // Set our Installation query
    data: {
      alert: pushContent
    }
  }
  if (expirationTime > 0) {
    pushObject.expiration_time = new Date(expirationTime);
  }

  console.log('pushObject: ', pushObject);

  Parse.Push.send(pushObject, {
        useMasterKey: true
  }, {
    success: function() {
      // Push was successful
      res.success('Push was successful');
    },
    error: function(error) {
      // Handle error
      res.error(error);
    }
  });
});

// Use Parse.Cloud.define to define as many cloud functions as you want.
// afterSave methods are used to create an AppUser if non-existent.
// beforeSave methods are used to avoid duplicates
//  Not implementing beforeSave for session rating because we only let the client create one object per session
//  Not implementing beforeSave for conference survey because we only let the client send it once
var sessionFavourite = Parse.Object.extend("SessionFavourite");
Parse.Cloud.beforeSave("SessionFavourite", function(request, response) {
  var query = new Parse.Query(sessionFavourite);
  // Add query filters to check for uniqueness
  query.equalTo("sessionId", request.object.get("sessionId"));
  query.first().then(function(existingObject) {
    if (existingObject) {
      existingObject.increment("state", request.object.get("state"));
    } else {
      // Pass a flag that this is not an existing object
      return Parse.Promise.as(false);
    }
  }).then(function(existingObject) {
    if (existingObject) {
      // Existing object, stop initial save
      response.error("Existing object");
    } else {
      // New object, let the save go through
      if (request.object.get("sessionId")) {
        response.success();
      }
    }
  }, function(error) {
    response.error("Error in SessionFavourite beforeSave: " + error.code + ": " + error.message);
  });
});

var advertisementCount = Parse.Object.extend("AdvertisementCount");
Parse.Cloud.beforeSave("AdvertisementCount", function(request, response) {
    response.success();
});

var appUser = Parse.Object.extend("AppUser");
//    Parse.Cloud.beforeSave("AppUser", function(request, response) {
//        if (!request.object.isNew()) {
//            // Let existing object updates go through
//            response.success();
//        }
//        var query = new Parse.Query(appUser);
//        // Add query filters to check for uniqueness
//        query.equalTo("uniqueDeviceIdentifier", request.object.get("uniqueDeviceIdentifier"));
//        query.first().then(function(existingObject) {
//            if (existingObject) {
//                // Update existing object
//                if (!existingObject.get("stateCounter")) {
//                    // counter is not yet defined
//                    if (existingObject.get("active") == true) {
//                        // Old object state is active
//                        existingObject.set("stateCounter", 1);
//                    } else {
//                        existingObject.set("stateCounter", 0);
//                    }
//                }
//
//                var increment = -1;
//                if (request.object.get("active") == true) {
//                    // New object state is active
//                    increment = 1;
//                }
//                existingObject.increment("stateCounter", increment);
//
//                var newState = false;
//                if (existingObject.get("stateCounter") > 0) {
//                    newState = true;
//                }
//                existingObject.set("active", newState);
//                return existingObject.save();
//            } else {
//                // Pass a flag that this is not an existing object
//                return Parse.Promise.as(false);
//            }
//        }).then(function(existingObject) {
//            if (existingObject) {
//                // Existing object, stop initial save
//                response.error("Existing object");
//            } else {
//                // New object, let the save go through
//                response.success();
//            }
//        }, function(error) {
//            response.error("Error in AppUser beforeSave: " + error.code + ": " + error.message);
//        });
//    });

Parse.Cloud.afterSave("AdvertisementCount", function(request) {
  if (request.object.get("uniqueDeviceIdentifier")) {
    AppUser = Parse.Object.extend("AppUser");
    query = new Parse.Query(AppUser);
    query.equalTo("uniqueDeviceIdentifier", request.object.get("uniqueDeviceIdentifier"));
    query.first({
      success: function(appUser) {
        if (!appUser) {
          appUser = new AppUser();
        }
        appUser.set("uniqueDeviceIdentifier", request.object.get("uniqueDeviceIdentifier"));
        appUser.set("deviceData", request.object.get("deviceData"));
        appUser.save();
      },
      error: function(error) {
        console.error("Error in AdvertisementCount afterSave: " + error.code + ": " + error.message);
      }
    });
  }
});

Parse.Cloud.afterSave("SessionRating", function(request) {
  if (request.object.get("uniqueDeviceIdentifier")) {
    AppUser = Parse.Object.extend("AppUser");
    query = new Parse.Query(AppUser);
    query.equalTo("uniqueDeviceIdentifier", request.object.get("uniqueDeviceIdentifier"));
    query.first({
      success: function(appUser) {
        if (!appUser) {
          appUser = new AppUser();
        }
        appUser.set("uniqueDeviceIdentifier", request.object.get("uniqueDeviceIdentifier"));
        appUser.set("deviceData", request.object.get("deviceData"));
        appUser.save();
      },
      error: function(error) {
        console.error("Error in AdvertisementCount afterSave: " + error.code + ": " + error.message);
      }
    });
  }
});
