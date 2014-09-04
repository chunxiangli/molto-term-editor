Ext.Loader.setConfig({
	enabled: true
}); 
Ext.Loader.setPath('Ext.ux', 'extjs-4.0.3/examples/ux');
Ext.require([
	'Ext.data.*',
        'Ext.grid.*',
	'Ext.util.*',
	'Ext.selection.CellModel',
       	'Ext.ux.CheckColumn',
        'Ext.ux.data.PagingMemoryProxy',
        'Ext.ux.ProgressBarPager',
	'Ext.ux.RowExpander'
]); 
Ext.QuickTips.init();
var termColumnFields = ['name','en','uri','es','de'];
var classColumnFields = ['class', 'uri'];
var itermsPerPage = 20;
Ext.onReady(function(){
	var type = 0;//0:superClass,1:terms
	var gridColumnConfigC = [
				{
                                         text: "class", dataIndex: "class",
                                },
				{text: "uri",flex:1, dataIndex: "uri", field:{xtype: 'urlfield', allowBlank: false}}
				];
	function cellRender(v, cell){
                                        cell.style = 'white-space:pre-wrap';
                                        var arrV = v.split(';');
                                        var sHtml = '';
                                        if (arrV.length > 1){
                                                for(var i = 0; i < arrV.length; i++){
                                                        sHtml +=arrV[i] + '\n';
                                                }
                                        }else{
                                                sHtml = v;
                                        }      
                                        return sHtml;
                                }       
	var gridColumnConfig = [
			    {text: "name", felx:1, dataIndex: "name",width:120, field:{xtype:stringEditor, allowBlank: false}},
                            {text: "uri", dataIndex: "uri", width:150,field:{xtype: stringEditor, allowBlank: false}},
                            {text: "es", dataIndex: "es", width:150,field: {xtype: stringEditor, allowBlank: true},renderer: cellRender},
                            {text: "en", dataIndex: "en", flex:1,field: {xtype: stringEditor, allowBlank: true}, renderer: cellRender},
                            {text: "de", dataIndex: "de", width:150,field: {xtype: stringEditor, allowBlank: true}, renderer: cellRender}
                           ];
			//query
			function query(_keywords, _type){
				myMask.show();
				sparqlQuery.query(_keywords, 'json', _type, function(data, _keywords){
						myMask.hide();
						if (!(data.results) || (data.results).length < 1){
                         				alert('No data for "' +  _keywords +'". Please tye some other terms!');
                				}else if (_type == 0){
							if (type == 0) gridClass.hide();
                                                        jsonProcess.sparql2Json(data);
                                                	var recordTotal= grid.getStore().getCount();
                                                	store.removeAll();
                                                	store.proxy.data = extJson;
                                                	store.loadPage(1);
							grid.show();
                                                }else{
							gridClass.show();
							grid.hide();
                                                        jsonProcess.class2Json(data);
							storeClass.proxy.data = classJson;
							storeClass.load();
						}
                                        });

			}
			//tbar
			var queryButton = Ext.create('Ext.Button',{
                        	text: 'query',
			 	pressed: true,
                         	handler: function(){
                                        var keywords = Ext.getCmp("queryEditor").getValue().trim();
					query(keywords, type);
                               }
                        });
			var addButton = Ext.create('Ext.Button',{
                        	text: 'Add Record',
                        	icon: 'images/table_row_insert.png',
                        	iconCls: 'x-btn-text-icon',
                        	handler: function(){
                                 	var newRow = Ext.ModelManager.create({'name': 'name',en:'english', uri:'http://',es:'es', de:'de'}, 'extJsonModel');
                                 	store.insert(0,newRow);
                                 	cellEditing.startEditByPosition({row:0, column:2});
                       		}	
			});
			var deleteButton = Ext.create('Ext.Button',{
						itemId: 'deleteRecord',
                                                text: 'Delete Record',
                                                icon: 'images/table_row_delete.png',
                                                 cls: 'x-btn-text-icon',
                                                handler: function(){
                                                        var sm = grid.getSelectionModel();
							cellEditing.cancelEdit();
                                                        var sel = sm.getSelection()[0];
                                                        if (sel){
                                                                Ext.Msg.show({
                                                                        title: 'Delete Record',
                                                                        buttons: Ext.MessageBox.YESNOCANCEL,
                                                                        msg: 'Remove '+sel.data.name + '?',
                                                                        fn: function(btn){
                                                                                if (btn == 'yes'){
											store.remove(sel);
											gfData.delete(sel.data);
											sm.select(0);
                                                                                }
                                                                        }
                                                                });
                                                        }
                                                },
						disabled: true
                       });
			//select
			var searchType = new Ext.data.SimpleStore({
                                fields: ['id', 'type'],
                                data: [['0', 'terms'], ['1', 'superClass']]
			});
			var searchTypeSelect = new Ext.form.ComboBox({
                               id: 'Search_Type',
                                xtype: 'combo',
                                name: 'SearchType',
                                hiddenName:'searchType',
                                allowBlank: false,
                                store: searchType,
                                displayField: 'type',
                                valueField: 'id',
                                triggerAction: 'all',
                                selectOnFocus: 'true',
                                editable: false,
				emptyText: 'default:superClass',
                        });
			searchTypeSelect.on('select', function(){
                                var typeIndex = searchTypeSelect.getValue();
                                if (typeIndex == 0) {
					type = 1;
					extJsonModel.fields= classColumnFields;
                                }else if(typeIndex == 1){
					type = 0;
					extJsonModel.fields= termColumnFields;
                                }else{
                                        Ext.Msg.alert('Which type do you want to search,terms or suparClass?');
                                }
			});
			//store part
			Ext.define('extJsonModel',{
                                 extend: 'Ext.data.Model',
                                 fields: termColumnFields
			});
			var store = Ext.create('Ext.data.Store',{
                                        pageSize: itermsPerPage,
                                        model: 'extJsonModel',
					groupField: 'class',
                                        autoLoad: {start: 0, limit: itermsPerPage},
                                        proxy: {
                                                type: 'pagingmemory',
                                                data: extJson,
                                                reader: {
                                                        type:'json',
                                                        root: 'data'
                                                }
                                        }
             		});
			Ext.define('classModel',{
				extend: 'Ext.data.Model',
				fields: classColumnFields
			});
			var storeClass = Ext.create('Ext.data.Store', {
				model:'classModel',
				proxy:{
					autoLoad: true,
					type: 'memory',
					data: classJson,
					reader:{
						type: 'json',
						root: 'data'
					}
				}
			});
			var groupingFeature = Ext.create('Ext.grid.feature.Grouping',{
        			groupHeaderTpl: '{name}:({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})'
    			});
			//grid part
			var queryEditor = new Ext.form.TextField({
                                fieldLabel: 'KeyWords',
				     width: 200,
                                        id: 'queryEditor',
                                regex:/^([a-zA-Z]| )*$/,
                                regexText: "keywords seperate by blank",
                                validateOnBlur: true,
                                validateEvent: 'click',
                                allowBlank: false

                        });
			var stringEditor = new Ext.form.TextField({
                                //regex:/^[]*$/,
                                regexText:"only string",
                                validateOnBlur: true,
                                validateEvent: 'click',
                                validator: function(){Ext.Msg.alert("please input string");},
                        });

			var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
                                clickToEdit: 1
                        });
			var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
				clicksToMoveEditor:1,
				autoCancel: false
			});
			var myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait..."});
			var grid = Ext.create('Ext.grid.Panel', {
                                store: store,
                                columns: gridColumnConfig,
				selModel: {
					selType: 'rowmodel',
				},
				viewConfig: {
				//	forceFit: true,
					stripRows: true
				},
				hideCollapseTool: true,
                                width: 720,
                                //height: 565,
				autoHeight:true,
                                frame: true,
                                title: 'iterms',
                                loadMask: true,
                                clearOnPageLoad: false,
                                bbar: Ext.create('Ext.PagingToolbar', {
                                        store:store,
                                        displayInfo: true,
                                        plugins: Ext.create('Ext.ux.ProgressBarPager',{})
                                }),
                                tbar:[addButton,deleteButton],
                                fbar: [{
                                        text: 'Undo',
                                        handler: function(){
								store.load();
								gfdata.resetAll();
							}
                                        },
                                        {
                                        text: 'Submit',
					iconCls: 'icon-save',
                                        handler: function(){
							var data = gfData.combineAll();
							console.log(Ext.encode(data)); 
							gfData.resetAll();
							}
                                        }
                                        ],
                                plugins: [cellEditing],
				listeners: {
					'selectionchange' : function(view, records){
						grid.down('#deleteRecord').setDisabled(!records.length);
						},
					'beforeedit': function(editor, e, option){
						var arrV = editor.value.trim().split(';');
						if (arrV.length > 1){
							editor.value = '';
							for(var i = 0 ; i < arrV.length; i++){
								editor.value += arrV[i]+'\n';	
							}
						}
					},
					'edit': function(editor,e, option){
						var rowIdx = e.rowIdx;
						var value = e.value;
						var field = e.field;
						var originValue = e.originalValue;
						var data = store.getAt(rowIdx).data;
						if (value != originValue){
							var jsonString = "{'name':'" + data.name + "','" + field + "':'" + value+"'}";
							gfData.edit(jsonString);
						}
					}
				}
                        });
			var gridClass = Ext.create('Ext.grid.Panel',{
				store: storeClass,
				columns: gridColumnConfigC,
				selModel:{
					selType: 'rowmodel'
				},
				loadMask: true,
				//height: 580,
				autoHeight:true,
				viewConfig:{
					stripRows: true
				},
				listeners: {
					'selectionchange': function(view, records){
						var keyword = records[0].data.class
						if (keyword.trim()){
							query(keyword, 0);
						}
					}
				}
			});
			var mainPanel = Ext.create('Ext.panel.Panel', {
				bodyPadding: 5,
				width:400,
				tbar: [[searchTypeSelect],[queryEditor],[queryButton]],
				items:[[gridClass]]
			});
			var viewport = Ext.create('Ext.Viewport', {
				layout: 'border',
				renderTo: 'editor_grid',
				items:[{
					region:'north',
					html: '<h1 class="x-panel-header">The term page</h1>',
					height: 25,
					border: false,
					},{
					region:'west',
					width: 120,
					border: false
					},{
						region:'center',
						layout: {
							type: 'hbox'
						},
						items: [mainPanel,grid],
						border:false
					},{
						region: 'east',
						width: 40,
						border: false
					},{
						region:'south',
						html:'<p></p>',
						autoHeight: true,
						border: false,
				}]
			});
			grid.hide();
			store.load();
});

