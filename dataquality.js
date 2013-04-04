// Data Quality: headless sanity checks for Yatayat System data.

var DQ = DQ || {};

// nearestStops returns squared-distance; 
// regardless, this is a magic number.
var SAME_STOP_DIST = Math.pow(0.0005,2);

DQ.sanityChecks = {
    // name of test -> function(route, [system])

    "nearby different stops": function(route, system) {
        // Returns: stop1.id -> stop2, when stop1 and stop2 are nearby
        // and different
        stopClosest = {};

        route.stops.forEach(function(stop) {
            var stops = system.nearestStops([stop.lat, stop.lng], 2, SAME_STOP_DIST)
                .filter(function(s) { return s.id !== stop.id; });
            if(stops.length > 0 && stop.name && stops[0].name && stops[0].name !== stop.name) {
                stopClosest[stop.id] = stops[0];
            }
        });

        return stopClosest;
    },

    "unnamed stops": function(route) {
        // Returns: stop.id -> true, when stop is unnamed
        unnamedStops = {};

        route.stops.forEach(function(stop) {
            if(!stop.name) {
                unnamedStops[stop.id] = true;
            }
        });

        return unnamedStops;
    },

    "no terminus": function(route) {
        // Returns true if route has no terminus, false otherwise
        return false ||  route._noTerminus;
    },

    "unconnected segments": function(route) {
        // Returns seg.id -> true, when Segment is unconnected
        unconnected = {};
        route._unconnectedSegments.forEach(function(seg) {
            unconnected[seg.id] = true;
        });
        return unconnected;
    },

    "similar names": function(route, system) {
        // Returns stop1.id -> stop2, when stop1 and stop2 have
        // similar names.

        // thanks! http://thinkphp.ro/apps/js-hacks/String.levenshtein/String.levenshtein.html
        var levenshtein = function(stringa, stringb) {
            var cost = new Array(),
            str1 = stringa,
            str2 = stringb,
            n = str1.length,
            m = str2.length,
            i, j;
            var minimum = function(a,b,c) {
                var min = a;
                if(b < min) {
                    min = b;
                }
                if(c < min) {
                    min = c;
                }
                return min;
            }

            if(n == 0 || m == 0) {
                return;  
            } 

            for(var i=0;i<=n;i++) {
                cost[i] = new Array();
            }

            for(i=0;i<=n;i++) {
                cost[i][0] = i;
            }

            for(j=0;j<=m;j++) {
                cost[0][j] = j;
            }

            for(i=1;i<=n;i++) {
                var x = str1.charAt(i-1);
                for(j=1;j<=m;j++) {
                    var y = str2.charAt(j-1);
                    if(x == y) {
                        cost[i][j] = cost[i-1][j-1]; 
                    } else {
                        cost[i][j] = 1 + minimum(cost[i-1][j-1], cost[i][j-1], cost[i-1][j]);
                    } 
                }
            }
            return cost[n][m];  
        };

        var preprocess = function(str) {
            return str.toLowerCase().replace(' ', '');
        };

        similarNames = {};

        // n^2 algorithm that compares string-distance between every two pairs of stop
        route.stops.forEach(function(stop) {
            
            system.routes.forEach(function(route2) {
                route.stops.forEach(function(stop2) {

                    if(stop.name && stop2.name && levenshtein(stop.name, stop2.name) < 3) {
                        var physicalDistance = Math.pow(stop.lat-stop2.lat,2) + Math.pow(stop.lng-stop2.lng,2);
                        if(physicalDistance > SAME_STOP_DIST) {
                            // console.log(stop.name, stop2.name, physicalDistance);
                            similarNames[stop.id] = stop2;
                        }
                        else if(stop.id != stop2.id) {
                            //console.log(stop.name, stop2.name, 'nearby');
                        }
                    }
                    
                });
            });
        });
        return similarNames;
    }
};

// For easier integration with data_quality.html, make aliases
DQ.nearbyDifferentStops = DQ.sanityChecks["nearby different stops"];
DQ.unnamedStops = DQ.sanityChecks["unnamed stops"];
DQ.similarNames = DQ.sanityChecks["similar names"];
DQ.noTerminus = DQ.sanityChecks["no terminus"];
DQ.unconnectedSegments = DQ.sanityChecks["unconnected segments"];

DQ.runAllTests = function(system) {
    // TODO
};


// export as a node module
var module = module || {};
module.exports = DQ;