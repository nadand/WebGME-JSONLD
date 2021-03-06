/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 0.14.0 from webgme on Thu Oct 15 2015 13:05:54 GMT-0500 (CDT).
 */

define([
    'plugin/PluginConfig',
    'plugin/PluginBase'//,
    //'jsonld'
], function (
    PluginConfig,
    PluginBase//,
    //jsonld
    ) {
    'use strict';

    /**
     * Initializes a new instance of JSONLDExport.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin JSONLDExport.
     * @constructor
     */
    var JSONLDExport = function () {
        // Call base class' constructor.
        PluginBase.call(this);
    };

    // Prototypal inheritance from PluginBase.
    JSONLDExport.prototype = Object.create(PluginBase.prototype);
    JSONLDExport.prototype.constructor = JSONLDExport;

    /**
     * Gets the name of the JSONLDExport.
     * @returns {string} The name of the plugin.
     * @public
     */
    JSONLDExport.prototype.getName = function () {
        return 'JSONLDExport';
    };

    /**
     * Gets the semantic version (semver.org) of the JSONLDExport.
     * @returns {string} The version of the plugin.
     * @public
     */
    JSONLDExport.prototype.getVersion = function () {
        return '0.1.0';
    };

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    JSONLDExport.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            createArtifacts;


        // Using the logger.
        //self.logger.debug('This is a debug message.');
        //self.logger.info('This is an info message.');
        //self.logger.warn('This is a warning message.');
        //self.logger.error('This is an error message.');

        // Using the coreAPI to make changes.

        self.jsonldOut={};
        self.idCounter = 0;
        self.idStore = {};
        self.typeId2NameStore = {};
        self.iriBase = "http://localhost:8888";

        createArtifacts = function(err){

            var sfcFileName = self.projectName + '.json'
            var artifact = self.blobClient.createArtifact('generatedFiles');
            artifact.addFile(sfcFileName, JSON.stringify(self.jsonldOut), function (err) {
                if (err) {
                    callback(err, self.result);
                    return;
                }
                
                self.blobClient.saveAllArtifacts(function (err, hashes) {
                    if (err) {
                        callback(err, self.result);
                        return;
                    }
                    // This will add a download hyperlink in the result-dialog.
                    self.result.addArtifact(hashes[0]);
                    // This will save the changes. If you don't want to save;
                    // exclude self.save and call callback directly from this scope.
                    self.result.setSuccess(true);
                    self.createMessage(self.rootNode, self.jsonldOut, 'info');
                    self.save('added obj', function (err) {
                        callback(null, self.result);
                    });
                });
                
            });
        }

        self.visitAllChildrenFromRootContainer(self.rootNode,function(err){
            if(err)
                self.logger.error(err);
            else
                createArtifacts(err);
        });
    };

    JSONLDExport.prototype.ROOT_visitor = function(node){
         var self = this;
        self.logger.info('Visiting the ROOT');

        var graph = [];
        var rootData = {
                "@context":{

                    "gme": self.iriBase,
                    "meta": self.iriBase + "/meta",
                    "xsd": "http://www.w3.org/2001/XMLSchema#",
                    "model": self.iriBase + "/model",
                    "gme:base": { "@id": "gme:/base", "@type": "@id" },
                    "gme:src": { "@id": "gme:/src", "@type": "@id" },
                    "gme:dst": { "@id": "gme:/dst", "@type": "@id" },
                    "gme:children": {"@id": "model:/children", "@type": "@id", "@container": "@set" }
                },
                "@graph":graph
            };

            var root = {
                "@id": 'model:' + '/root',
                "@type": "gme:root",
                "model:name": {value: self.projectName, type:"string"},
                "gme:children": []
            };

            var rootChilds = self.core.getChildrenPaths(node);
            for (var i = 0; i < rootChilds.length; i += 1 ){
                root["gme:children"].push( 'model:' + rootChilds[i] );  
            }
            graph.push(root);
            
            var meta = {
                "@id": 'model:' + '/meta',
                "@type": "gme:META",
                "gme:children": []
            };
            for (var entry in self.META) {
                if (self.META.hasOwnProperty(entry)) {
                    meta["gme:children"].push( 'model:' + self.core.getPath(self.META[entry]) );  
                }
            }

            graph.push(meta);

        self.jsonldOut = rootData;
        return {context:{jsonldOut: self.jsonldOut, parent: graph, meta: meta }};
    }

    JSONLDExport.prototype.generalVisitor = function(node, parent, context){
        var self = this;
        self.logger.info('Visiting a Node');

        var nodeAttrNames = self.core.getAttributeNames(node);
        var nodePtrNames = self.core.getPointerNames(node);
        var nodeChilds = self.core.getChildrenPaths(node);
        var nodeModel = {
                //"name": self.core.getAttribute( node, 'name' ),
                "@id": 'model:' + self.core.getPath(node),
                "@type": "model",
                "gme:base": 'model:' + self.core.getPointerPath(node, 'base')
            };

        for ( var i = 0; i < nodeAttrNames.length; i += 1 ) {
            nodeModel["model:" + nodeAttrNames[i]] = {
                value: self.core.getAttribute( node, nodeAttrNames[i]),
                type: self.core.getAttributeMeta(node, nodeAttrNames[i])['type']};
        }

        for ( i = 0; i < nodePtrNames.length; i += 1 ) {
            if(nodePtrNames[i] == 'src' || nodePtrNames[i] == 'dst'){
                nodeModel["gme:" + nodePtrNames[i]] = {
                    value: 'model:' +  self.core.getPointerPath( node, nodePtrNames[i] ),
                    type: "pointer"
                };
            }else if(nodePtrNames[i] != 'base'){
                nodeModel["model:" + nodePtrNames[i]] = {
                    value: 'model:' +  self.core.getPointerPath( node, nodePtrNames[i] ),
                    type: "pointer"
                };
            }
        }
        if(nodeChilds.length > 0 ){
            nodeModel["gme:children"] = [];
            for ( i = 0; i < nodeChilds.length; i += 1 ) 
                nodeModel["gme:children"].push( 'model:' + nodeChilds[i] );  
        }
        

        context['parent'].push(nodeModel);   
        return {context:context};
    }

    JSONLDExport.prototype.getVisitorFuncName = function(nodeType){
        var self = this,
            visitorName = 'generalVisitor';
        //if(nodeType){
        //    visitorName = 'visit_'+ nodeType;
        //}
        self.logger.debug('Genarated visitor Name: ' + visitorName);
        return visitorName;   
    }

    JSONLDExport.prototype.getPostVisitorFuncName = function(nodeType){
        var self = this,
            visitorName = 'generalPostVisitor';
        if(nodeType){
            visitorName = 'post_visit_'+ nodeType;
        }
        self.logger.debug('Genarated post-visitor Name: ' + visitorName);
        return visitorName;
        
    }

    JSONLDExport.prototype.getChildSorterFunc = function(nodeType, self){
        var self = this,
            visitorName = 'generalChildSorter';

        var generalChildSorter = function(a, b) {

            //a is less than b by some ordering criterion : return -1;
            //if(self.isMetaTypeOf(a, self.META['Types'])){
            //    return -1;
            //}
            //a is greater than b by the ordering criterion: return 1;
            //if(self.isMetaTypeOf(b, self.META['Types'])){
            //    return 1;
            //}

            // a equal to b:
            return 0;
        };
        return generalChildSorter;
        
    }

    JSONLDExport.prototype.excludeFromVisit = function(node){
        var self = this,
            exclude = false;

        //exclude = exclude || self.isMetaTypeOf(node, self.META['Meta']);

        return exclude;

    }

    JSONLDExport.prototype.visitAllChildrenFromRootContainer = function ( rootNode, callback ) {
        var self = this,
            error = '',
            context = {},
            counter,
            counterCallback;


        counter = {
            visits: 1
        };
        counterCallback = function ( err ) {
            error = err ? error + err : error;
            counter.visits -= 1;
            if ( counter.visits === 0 ) {
                try{
                    var ret = self['ROOT_post_visitor'](rootNode, context);
                }catch(err){
                    self.logger.debug('No post visitor function for ' + self.core.getAttribute(rootNode,'name'));
                }
                callback( error === '' ? undefined : error );
            }
        };
        try{
            var ret = self['ROOT_visitor'](rootNode, context);
            if(ret['error']){
                callback( error === '' ? undefined : error );
                return;
            }else{
                context = ret['context'];
            }
        }catch(err){
            self.logger.debug('No visitor function for ' + self.core.getAttribute(rootNode,'name'));
        }

        self.visitAllChildrenRec( rootNode, context, counter, counterCallback );
    };

    JSONLDExport.prototype.visitAllChildrenRec = function ( node, context, counter, callback ) {
         var self = this;

        if (self.excludeFromVisit(node)){
            callback(null, context);
            return;
        }

        self.core.loadChildren( node, function ( err, children ) {
            var i,
                atModelNodeCallback,
                doneModelNodeCallback,
                nodeType,
                sorterFunc;
            if ( err ) {
                callback( 'loadChildren failed for ' + self.core.getAttribute( node, 'name' ) );
                return;
            }

            doneModelNodeCallback = function ( childNode ) {
                return function ( err, ctx ) {
                    if ( err ) {
                        callback( err );
                        return;
                    }
                };
            };

            if ( children.length === 0 ) {
                self.doneModelNode(node,context,doneModelNodeCallback);
                callback( null );
                return;
            } 
            counter.visits += children.length;
            counter.visits -= 1;
            atModelNodeCallback = function ( childNode ) {
                return function ( err, ctx ) {
                    if ( err ) {
                        callback( err );
                        return;
                    }
                    self.visitAllChildrenRec( childNode, ctx, counter, callback );
                };
            };
            if(node !== self.rootNode){
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );
            }
            sorterFunc = self.getChildSorterFunc(nodeType, self);
            if(sorterFunc){
                children.sort(sorterFunc);
            }
            for ( i = 0; i < children.length; i += 1 ) {
                self.atModelNode( children[ i ], node, self.cloneCtx(context), atModelNodeCallback( children[ i ] ) );
            }

            

            if(node !== self.rootNode){
                self.doneModelNode(node,context,doneModelNodeCallback);
            }
            
        } );
    };

    JSONLDExport.prototype.atModelNode = function ( node, parent, context, callback ) {
        var self = this,
            nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' ),
            nodeName = self.core.getAttribute( node, 'name' ),
            ret = null;

        try{
            ret = self[self.getVisitorFuncName(nodeType)](node, parent, context);
            if(ret['error']){
                callback( error === '' ? undefined : error );
                return;
            }else{
                callback(null, ret['context']);
                return;
            }

        }catch(err){
            self.logger.debug('No visitor function for ' + nodeType);
        }
        callback(null, context);
        return;

    };

    JSONLDExport.prototype.doneModelNode = function ( node, context, callback ) {
        var self = this,
            nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' ),
            nodeName = self.core.getAttribute( node, 'name' ),
            ret = null;

        try{
            ret = self[self.getPostVisitorFuncName(nodeType)](node, context);
            if(ret['error']){
                callback( error === '' ? undefined : error );
                return;
            }else{
                callback(null, ret['context']);
                return;
            }

        }catch(err){
            self.logger.debug('No post visitor function for ' + nodeType);
        }
        callback(null, context);
        return;

    };

    JSONLDExport.prototype.cloneCtx = function (obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }

    return JSONLDExport;
});