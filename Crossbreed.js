/*
 * CROSSBREED.JS - Multiple Inheritance in JavaScript
 * by Nicklaus Liow - http://ncase.me
 * MIT License.
 */

(function(exports){

var copy = function(src,dest){
    for( var key in src ){
        dest[key] = src[key];
    }
    return dest;
};

var createClass = function(config){

    // Get the names of all parents
    var parentNames = config.is || []; // No "is".
    if(!Array.isArray(parentNames)) parentNames = [parentNames]; // Single "is".

    // Get the Prototypes of all parents
    var parentPrototypes = [];
    for(var i=0; i<parentNames.length; i++){
        var parentClass = exports[parentNames[i]];
        parentPrototypes.push(parentClass.prototype);
    }

    // Create the new Prototype by:
    // 1) Copying over parents' properties, in reverse order.
    // 2) Copying over the original Config
    var prototype = {};
    for(var i=parentPrototypes.length; i>=0; i--){
        copy(parentPrototypes[i],prototype);
    }
    copy(config,prototype);

    // Get a list of all the NEW functions added to the Class.
    var funcNames = [];
    for( var key in config ){
        if(typeof config[key]==="function"){
            funcNames.push(key);
        }
    }

    // If inheriting from parent(s), wrap all these new functions with this.super.
    if(parentNames.length>0){

        for(var i=0;i<funcNames.length;i++){
            var funcName = funcNames[i];
            var func = prototype[funcName];

            if(parentNames.length==1){
                
                var parentFunc = parentPrototypes[0][funcName];
                var newFunc = function(){
                    var _previousSuper = this.super;
                    if(parentFunc){
                        this.super = parentFunc.bind(this);
                    }   
                    var result = func.apply(this, arguments);        
                    this.super = _previousSuper;
                    return result;
                };

            }else{

                // Create Super object.
                var superObject = {};
                for(var j=0;j<parentNames.length;j++){
                    var parentName = parentNames[j];
                    superObject[parentName] = parentPrototypes[j][funcName];
                }

                var newFunc = function(){
                    var _previousSuper = this.super;
                    this.super = {};
                    for( var Parent in superObject ){
                        if(superObject[Parent]){
                            this.super[Parent] = superObject[Parent].bind(this);
                        }
                    }
                    var result = func.apply(this, arguments);        
                    this.super = _previousSuper;
                    return result;
                };

            }

            prototype[funcName] = newFunc;
        }

    }

    // Finally creating the Class.
    var Klass = function(){
        if(this.initialize){
            this.initialize.apply(this,arguments);
        }
    };
    Klass.prototype = prototype;
    return Klass;

};

// EXPORT
exports.Class = {
    create: function(id,config){
        exports[id] = createClass(config);
    }
};

})(window);