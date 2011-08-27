var merge = require('./public/controls/control').utils.merge;
var control = require('./public/controls/control').control;
var page = require('./public/controls/page').page;
var model = require('./public/data/model');
var store = require('./public/data/store').store;
/*
 * The application class is used to start
 * 
 * config: {
 * 	view(string): name of the view to show 'search', 'logout', 'form'. Defaults to 'home'.
 *  mode(string): 'edit', or 'view',
 *  
 * }
 * 
 * session: represent the session for the requesting user
 * clientData: if this code is running on the client, the clientData provides the data 
 * that would have been accessible on the server. Typically server side controls provide
 * that data
 */
var application = function(config, session, clientData){
	config = config || {};
	config.view = config.view || 'home';
	var viewItem = null;
	if(config.view==='logout'){
		config.view = 'home';
		session.user = null;
		session.destroy();
	}
	if(config.view==='search'){
		viewItem = {
			controlType: 'list',
			name: 'searchList',
			query: {_type:'user'},
			setSearch: function(query){
				alert(query);
			}
		};
	}
	else if(config.view==='form'){
		if(config.mode !== 'view' && config.mode !== 'edit'){
			config.mode = 'view';
		}
		var formModel = model.getModel(config.model);
		if( 
			(config.mode ==='edit' && !config.id && formModel.canCreate(session)) ||
			(config.mode ==='edit' && config.id && formModel.canUpdate(session)) ||
			(config.mode ==='view' && formModel.canRead(session))){
			viewItem = {
				controlType: 'form',
				mode: config.mode,
				issues: config.issues,
				session: session,
				name: 'form',
				title: true,
				model: config.model,
				value: config.value || config.id || null,
				returnTo: config.returnTo
			};
		}
		else if(!session.user){
			// Tried to edit / view but was denied, no user account: try to login
			viewItem = merge({returnTo: config}, user.loginView);
		}
		else {
			// Access denied
		}
	}
	else {
		viewItem = {
			tag:'section',
			view: 'home',
			controlValue: config.welcomeMessage || 'Default welcome message',
			attributes: {
				cls: (config.view !== 'home') ? 'hidden' : null
			}
		};
	}
	/*
	 * If we have a valid viewItem, make sure we construct it now to trigger any async
	 * loading that calls busy() and done()
	 */
	page.call(this, {
		title: config.title || 'Default title',
		store: new store({clientCache: clientData}),
		viewport: true,
		stylesheets: application.config.stylesheets || [],
		scripts: [{src: '/script.js?simple'}, {name: 'bootScript', controlValue:'tbd'}],
		bodyAttributes: {onload: "boot();"},
		body: [{
			controlType: 'topbar',
			name: 'topbar',
			user: session ? session.user : null,
			title: application.config.title
		},{ 
			name: 'navigationcontrol',
			attributes: {
				"class": 'navigationcontrol'
			},
			items: [ {
				tag: 'nav',
				name: 'sidepanel',
				items:[{
						tag:'a',
						controlValue: 'Users',
						attributes: {
							cls: 'sidepanelbutton'
						}
					},{
					tag: 'footer',
					name: 'mainfooter',
					controlValue: config.copyright || '2011(c) All rights reserved'
				}]
			}, {
				tag: 'section',
				name: 'viewStack',
				items: [ viewItem ],
				attributes: {
					"class": 'viewStack'
				}
			}]
		}]
	});
};

application.inheritsFrom(page);

application.config = {
	stylesheets: ['./css/style.css', './css/buttons.css'],
	title: 'framework',
	models: []
};

application.prototype.bind = function(rootElement){
	this.baseClass.bind.call(this, rootElement);
	this.body.topbar.on('search', function(sender, eventName, eventData){
		this.body.searchList.setSearch(eventData.query);
	}.scope(this));
};

control.registry['application'] = application;

exports = module.exports = {
	application : application
};