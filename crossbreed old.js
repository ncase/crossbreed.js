(function(window){

// "SCOPE" instead of "NAMESPACE"?????

var Scope = {

    defaultScope: window,

    add: function(scope,path,obj){

        // Default arguments
        if(obj===undefined){
            obj = path;
            path = scope;
            scope = Scope.defaultScope;
        }

        // Splits path with "." delimiter
        var parts = path.split('.');

        // Only if adding object, removes the last part of path AND make it objName
        var objName = (obj!==undefined) ? parts.splice(parts.length-1,1)[0] : undefined;
        var currSpace = scope;
        var currPart;

        // Traverse down path, creating empty objects along the way.
        for( var i=0, l=parts.length; i<l; i++ ){
            currPart = parts[i];
            currSpace[currPart] = currSpace[currPart] || {};
            currSpace = currSpace[currPart];
        }

        // If adding an object, add it and return it.
        if(obj!==undefined){
            currSpace[objName] = obj;
            return obj;
        }

        // Else, return newly created space.
        return currSpace;

    },

    // Instead of replacing wholesale,
    // Each property in the object gets added individually.
    addon: function(scope,path,obj){

        // Default arguments
        if(!obj){
            obj = path;
            path = scope;
            scope = Scope.defaultScope;
        }

        // If Object
        if( typeof obj === "object" ){
            // Each property in the object gets added individually.
            for( var key in obj ){
                Scope.add( scope, path+"."+key, obj[key] );
            }
        }else{
            // Else, just add.
            Scope.add(scope,path,obj);
        }

    },

    // Alias for Add, without warning.
    set: function(scope,path,obj){
        return Scope.add(scope,path,obj);
    },

    // Get some stuff
    get: function(scope,path){

        // Default arguments
        if(!path){
            path = scope;
            scope = Scope.defaultScope;
        }

        // Splits path with "." delimiter
        var parts = path.split('.');
        var currSpace = scope;
        var currPart;

        // Traverse down path, return ONLY IF undefined, (not null)
        for( var i=0, l=parts.length; i<l; i++ ){
            currPart = parts[i];
            if(currSpace[currPart]===undefined){
                return undefined;
            }else{
                currSpace = currSpace[currPart];
            }
        }

        // If successful, return last object.
        return currSpace;
    },

    // Nickname
    nickname: function(path){
        var nameArray = path.split(".");
        return nameArray[nameArray.length-1];
    },

};

window.Scope = Scope;

})(window);





(function(window){


Scope.addon("util",{

    copy: function(src,dest,clobber){

        // ERRORS
        if(src==null){
            console.warn("Attempting to copy from EMPTY source!");
        }
        if(dest==null){
            console.warn("Attempting to copy to EMPTY destination!");
        }

        // Default
        clobber = (clobber===undefined) ? true : clobber;

        // TO-DO: Holy shit this is hacky.
        // The normal way first, IFF the other way WON'T work.
        for( var key in src ){
            if( dest[key]===undefined || clobber ){
                var propDef = Object.getOwnPropertyDescriptor(src,key);
                if(!propDef){
                    dest[key] = src[key];
                }
            }
        }

        // The only-that-level-in-prototype-chain way
        var keys = Object.getOwnPropertyNames(src);
        for(var i=0; i<keys.length; i++){
            var key = keys[i];
            if( dest[key]===undefined || clobber ){
                var propDef = Object.getOwnPropertyDescriptor(src,key);
                if(propDef){
                    Object.defineProperty(dest,key,propDef);
                }
            }
        }

        return dest;

    },

    clone: function(src){
        return util.copy(src,{});
    },

    toArray: function(obj){
        if(obj==null) return [];
        return Array.isArray(obj) ? obj.slice(0) : [obj];
    }

});

// STRING
Scope.addon("util.string",{

    regexArray: function(array,regex){
        var matches = [];
        for(var i=0; i<array.length; i++){
            if( regex.test(array[i]) ){
                matches.push(array[i]);
            }
        }
        return matches;
    }

});


})(window);









/* 
 */
(function(window){

var _WaitList = [];

var _handleProxies = function(target,proxyDef){

    // Gets & Sets
    var keys = Object.keys(proxyDef),

        getGets = util.string.regexArray( keys, /^get[A-Z]/ ),
        gets = _handleProxyProps(getGets),

        setSets = util.string.regexArray( keys, /^set[A-Z]/ ),
        sets = _handleProxyProps(setSets),

        both = gets.concat(sets);

    for(var i=0; i<both.length; i++){

        var pName = both[i],
            gIndex = gets.indexOf(pName),
            sIndex = sets.indexOf(pName),
            isGet = gIndex>=0,
            isSet = sIndex>=0,
            def = {
                enumerable: true,
                configurable: true
            };

        // DEFINE ONLY IF NEVER EXISTED BEFORE
        if( target[pName] !== undefined ) continue;

        // GET
        if(isGet){
            var func = proxyDef[ getGets[gIndex] ];
            if( typeof func !== "function" ) continue;
            if( func.length !== 0 ) continue;
            def.get = func;
        }

        // SET
        if(isSet){
            var func = proxyDef[ setSets[sIndex] ];
            if( typeof func !== "function" ) continue;
            if( func.length !== 1 ) continue;
            def.set = func;
        }

        // DEFINE!
        Object.defineProperty( target, pName, def );

    }

    return target;

};
var _handleProxyProps = function(input){
    var output =[];
    for(var i=0; i<input.length; i++){
        var p = input[i];
        output.push( p.substr(3,1).toLowerCase() + p.substr(4) );
    }
    return output;
};

var _handleStatic = function(target,def){

    // Static Keys
    var staticDef = {};
    var staticKeys = util.string.regexArray( Object.keys(def), /^\$/ );
    for(var i=0; i<staticKeys.length; i++){
        var $key=staticKeys[i], key=$key.substr(1);
        staticDef[key] = target[key] = def[$key];
    }

    // Options
    target.OPTIONS = target.OPTIONS || {};

    // Static Proxies
    if(target.OPTIONS.auto_getters_setters){
        _handleProxies(target,staticDef);
    }

    return target;

};
var _cutStatic = function(def){
    var staticKeys = util.string.regexArray( Object.keys(def), /^\$/ );
    for(var i=0; i<staticKeys.length; i++){
        delete def[ staticKeys[i] ];
    }
};


var _createClass = function(waitee){

    var def=waitee.def, 
        name=waitee.name;

    // Create Class!
    var realClass = _getClassFromDef(def);
    realClass.classPath = name;
    realClass.className = Scope.nickname(name);

    // $Static using the $ identifier!
    _handleStatic(realClass,def);

    // GETTERS & SETTERS
    // GETTERS & SETTERS
    if(realClass.OPTIONS.auto_getters_setters){
        _handleProxies( realClass.prototype, realClass.prototype );
    }

    // Add to Scope
    Scope.add(window,name,realClass);

    // Main
    if(realClass.main && typeof realClass.main==="function"){
        realClass.main();
    }

    // Update Dependencies
    var index = _WaitList.indexOf(waitee);
    _WaitList.splice(index,1);
    _onClassCreated(name);

    // Return, in case you need it NOW.
    return realClass;

};

var _checkWaitee = function(waitee){

    // Remove existing parents
    for(var i=0; i<waitee.requires.length; i++){
        var parentName = waitee.requires[i];
        if( Scope.get(window,parentName) ){
            waitee.requires.splice(i,1);
            i--;
        }
    }

    // No parents left to wait for?
    if( waitee.requires.length==0 ){
        return _createClass(waitee);
    }else{
        return undefined;
    }

}

var _onClassCreated = function(className){
    for(var i=0; i<_WaitList.length; i++){

        var waitee = _WaitList[i];
        var index = waitee.requires.indexOf(className);
        
        // If the class created is a dependency, remove it & check.
        if(index>=0){
            waitee.requires.splice(index,1);
            if( _checkWaitee(waitee) ){
                i--;
            }
        }

    }
}

// ADD JUST TO DEF
var _add = function(name,def) {

    // TODO: If no name, it's anonymous, return real class immediately.
    // If no name, it's temporary.
    if(!def){
        def = name;
        name = Class._TEMP;
    }

    // Add to WaitList
    var waitee = {
        name: name,
        def: def,
        requires: util.toArray(def.is)
    };
    _WaitList.push(waitee);
    var realClass = _checkWaitee(waitee);

    // Return, in case you need it NOW.
    return realClass;

};

// GET CLASS FROM NAME
var _getClassFromName = function(name){
    return Scope.get(window,name);
};

// GET CLASS FROM DEF
var _inheriting = false;
var _getClassFromDef = function(def){

    // Get parents: Reverse because the first one overrides the rest.
    var parentNames = util.toArray(def.is).reverse();
    var parents = [];
    for( var i=0, l=parentNames.length; i<l; i++ ){
        parents.push( _getClassFromName(parentNames[i]) );
    }

    // Copy parent properties over to prototype
    var proto = {};
    var parentInstances = [];
    _inheriting = true;
    for( var i=0, l=parents.length; i<l; i++ ){
        var parentInstance = new parents[i]();
        parentInstances.push(parentInstance);
        util.copy(parentInstance,proto);
        util.copy(parentInstance.__proto__,proto);
    }
    _inheriting = false;

    // Copy definition's properties over to prototype

    var safeDef = util.clone(def);
    delete safeDef.is;
    _cutStatic(safeDef);

    for( var propName in safeDef ){
        
        // Don't do it if it's a getter method disguised.
        //var propDef = Object.getOwnPropertyDescriptor(safeDef,propName);
        //if(propDef && propDef.get) continue;

        var prop = safeDef[propName];

        if(typeof prop==="function"){
            // If a function overrides another function, make it Super.
            var overrides = false;
            var parentFuncs = [];
            for( var i=0, l=parentInstances.length; i<l; i++ ){
                var parentFunc = parentInstances[i][propName];
                parentFuncs.push(parentFunc);
                if(parentFunc!==undefined && typeof parentFunc==="function"){
                    overrides = true;
                }
            }
            if(overrides){

                // Redefine Props
                var funcName = propName,
                    func = prop,
                    scopeSuper;

                if(parents.length==1){
                    // If only ONE super, make it: this.super();
                    scopeSuper = parentFuncs[0];
                }else{
                    // If MORE supers, follow this.super.Parent();
                    scopeSuper = [];
                    for( var i=0, l=parentFuncs.length; i<l; i++ ){
                        var parentFunc = parentFuncs[i];
                        if(parentFunc!==undefined && typeof parentFunc==="function"){
                            scopeSuper[ Scope.nickname(parentNames[i]) ] = parentFunc;
                            scopeSuper.push(parentFunc);
                        }
                    }
                }

                // WRAP SUPER with CLOSURE
                (function(proto,funcName,func,scopeSuper){
                    // When entering the function, use that object's supers.
                    proto[funcName] = function(){
                        var tmp = this.super;
                        if(typeof scopeSuper==="function"){
                            this.super = scopeSuper.bind(this);
                        }else{
                            this.super = {};
                            for( var Parent in scopeSuper ){
                                this.super[Parent] = scopeSuper[Parent].bind(this);
                            }
                        }
                        var result = func.apply(this, arguments);        
                        this.super = tmp;
                        return result;
                    };
                })(proto,funcName,func,scopeSuper);

            }else{
                // Otherwise, meh.
                Object.defineProperty(
                    proto, propName, 
                    Object.getOwnPropertyDescriptor(safeDef,propName)
                );  
            }
        }else{
            // Otherwise, meh.
            Object.defineProperty(
                proto, propName, 
                Object.getOwnPropertyDescriptor(safeDef,propName)
            );
        }
    }

    // Create Base Class
    var NewClass = function Classy() {
        _initialize(this,arguments);
    };
    NewClass.prototype = proto;

    // Self Reference
    NewClass.prototype.Class = NewClass;
    NewClass.def = def;

    // Parent Names and Is Instance Of
    NewClass.parents = NewClass.parents || [];
    for( var i=0, l=parents.length; i<l; i++ ){
        if(parents[i].parents){
            NewClass.parents = NewClass.parents.concat(parents[i].parents);
        }
    }
    NewClass.parents = NewClass.parents.concat(parentNames);
    NewClass.prototype.isA = function(className){
        if(className==="Object") return true;
        if(Scope.nickname(className)===NewClass.className) return true;
        return _oneOfMyParents(NewClass,className);
    };
    NewClass.isA = function(className){
        if(className==="Function") return true;
        if(className==="Class") return true;
        if(Scope.nickname(className)===NewClass.className) return true;
        return _oneOfMyParents(NewClass,className);
    };

    // Return
    return NewClass;

};

var _oneOfMyParents = function(klass,className){
    // Normal full path
    if( klass.parents.indexOf(className)>=0 ){
        return true;
    }else{
        // Attempt nicknames
        var parentNicknames = [];
        for( var i=0; i<klass.parents.length; i++ ){
            parentNicknames.push( Scope.nickname( klass.parents[i] ) );
        }
        return parentNicknames.indexOf(className)>=0;
    }
}

var _initialize = function(me,args){
    if ( !_inheriting ){
        if(!me.initialize){
            me.initialize = function(){};
        }
        me.initialize.apply(me,args);
    }
};

var _extend = function(parent, def) {
    if (arguments.length == 1) { def = parent; parent = null; }
    if(typeof parent==="function"){
        // If it's a class, make an anonymous class for now.
        Scope.add(window,"anon.Anonymous",parent);
        parent = "anon.Anonymous";
    }
    if(parent) def.is=parent;
    return _add(def);
};

var _addon = function(name,def) {
    def.is = name;
    return Class.add(name,def);
}

var Class = {
    
    add:_add,
    addon:_addon,
    extend:_extend,
    create:_extend,
    _TEMP:"_tmp",

    isA: function(obj,className){
        if(obj.isA){
            return obj.isA(className);
        }else{
            return obj instanceof Scope.get(className);
        }
    },

};
window.Class = Class;

})(window);