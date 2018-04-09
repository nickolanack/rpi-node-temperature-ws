var UISlider=new Class({
	Extends:UIControl,
	knob:null,
	initialize:function(element, options)
	{

	var me=this;
	var defaultImageSuffix="";
	if(options.direction&&options.direction=="vertical"){
		defaultImageSuffix="_vert"; //there are default images for the slider and knob, the slider image has a cooresponding vertical image.
		//this is ignored if user defined image is given
	}
	me.container=element;
	this.parent(element, Object.append({},{
		//try to get local copy otherwise it probably exists on the main geolive server.

		slideImageKnob:false,
		slideImageKnobTopLeft:options.direction=="vertical"?[0,193]:[190,0],
		slideImageKnobBottomRight:options.direction=="vertical"?[5,207]:[210,5],
		knobTopLeft:options.direction=="vertical"?[4,3]:[4,-7],
		knobBottomRight:options.direction=="vertical"?[17,17]:[17,13],
		knobWidth:18,
		knobHeight:18,
		range:options.direction=="vertical"?[100,0]:[0,100],
		slideLimitX:options.direction=="vertical"?[0,0]:false,
		slideLimitY:options.direction=="vertical"?false:[0,0],
		direction:"horizontal",
		knobLimitX:options.direction=="vertical"?[-7,-7]:false,
		knobLimitY:options.direction=="vertical"?false:[-7,-7],
		length:150, 
		lengthUnit:'px',
		minPeepholeLength:50,
		peepholeWidth:5,
		steps:0, //steps can be an integer, or if 0, a linear value based on the pixel location is used
		increment:1, //increment number of pixels to move at a time.
		showValues:false,
		showState:false,
		displayPrefix:"",
		displaySuffix:"",
		precision:2,
		valueClassPrefix:"",
		state:0,
		label:false
	},options)); //parent calls this._render!	
	},
	_formatOutputValue:function(state){
		var me=this;
		return Math.round(state*me._scale)/me._scale;;
	},
	_render:function(container){
		
		var me=this;
		var lengthAxis="width";
		var widthAxis="height";	
		
		if(me.options.direction=="vertical"){
			lengthAxis="height";
			widthAxis="width";
		}
		
		
		
		if(!me.options.length){
			me.options.length=me.options.slideImageKnobBottomRight[0];
		}
		var group=new Element('div', {"class":"linear_slider "+me.options.direction, style:"position:relative;"});
		me.group=group;
		var bar=new Element('div', {"class":"bar", style:"margin-right:5px; position:relative; overflow-y:hidden; overflow-x:hidden; "+widthAxis+":"+me.options.peepholeWidth+"px; "+lengthAxis+":"+me.options.length+me.options.lengthUnit+";"});	

		var knob=new Element('div', {'class':'ui-ctrl-handle', style:"position:absolute; height:"+me.options.knobHeight+"px; width:"+me.options.knobHeight+"px;"});

		container.appendChild(group);
		group.appendChild(bar);
		group.appendChild(knob);
		me.knob=knob;//slideImage;
		me.bar=bar;
	
		
		
		
		
		
		if(me.options.showValues){
			
			var max=new Element('div',{'class':me.options.valueClassPrefix+"label",
				events:{
					click:function(){
						me._setState(me.range[me.options.direction=="vertical"?0:1]);	
					}},
				style:"cursor:pointer; position:absolute; "+(me.options.direction=="vertical"?"top:2px; left:36px;":"top:15px; right:-10px;")+" z-index:1; cursor:pointer;"});
			var min=new Element('div',{'class':me.options.valueClassPrefix+"label", 
				events:{
				click:function(){
					me._setState(me.range[me.options.direction=="vertical"?1:0]);	
				}},
				style:"cursor:pointer; position:absolute; "+(me.options.direction=="vertical"?"bottom:2px; left:36px;":"top:15px; left:-10px;")+" z-index:1; cursor:pointer;"});
			
			
			
			max.innerHTML=me.range[me.options.direction=="vertical"?0:1];
			min.innerHTML=me.range[me.options.direction=="vertical"?1:0];
			group.appendChild(max);
			group.appendChild(min);
	
		}
		
		if(me.options.showState){
			
			
			var value=new Element('div',{
				'class':me.options.valueClassPrefix+"display", 
				style:"position:absolute; "+(me.options.direction=="vertical"?"height:"+me.options.length+"px; left:50px; top:0;":"left:"+(me.options.length/2+5)+"px; top:22px;")+" z-index:1; vertical-align:middle;"});
			me.element.appendChild(value);
			me.valueLabel=value;

		}
		
		if(me.options.label){
			var label=new Element('div',{'class':"title"});
			label.innerHTML=me.options.label;
			me.element.appendChild(label);
			me.label=label;
		}
		
		
	},
	
	_enableUserInteraction:function(){	
		var me=this;
		
		var limit={};
		if(me.options.direction=="vertical"){
			limit.x=[-8,-8];
			limit.y=[-9, me.bar.getSize().y-9];
		}else{
			limit.x=[-9, me.bar.getSize().x-9];
			limit.y=[-8,-8];
		}
		
		var drag=me.knob.makeDraggable({
			handle:me.knob,
			limit:limit,
	
			onStart:function(){
				me.isRespondingToTouches=true;
				me.group.addClass('dragging');
			},
			onDrag: function(el){ 	//el -> drag-able element (not used)
				me._updateLabelsWithState(me._stateWithPart(me.knob));
			},
			onComplete:function(){
				
				me._stateChangeTo(me._stateWithPart(me.knob));
				me.group.removeClass('dragging');
				me.isRespondingToTouches=false;
			}
		});
		me.group.removeClass('disabled');
		me.drag=drag;
	},
	_disableUserInteraction:function(){
		
		var me=this;
		me.knob.removeEvents();

		me.drag=null;
		me.group.addClass('disabled');
	},
	_generateStateMap:function(){
		var me=this;
		me._scale=Math.pow(10,Math.max(0, me.options.precision));
	},
	_moveablePartsList:function(){
		var me=this;
		return [me.knob]; 
	},
	_stateWithPart:function(part){
		//return the state value calculated
		//by the current parts position.
		//it is assumed that only one part will move at a time
		var me=this;
		if(part==me.knob){
			
			var s=me.bar.getSize();
			var p=me.knob.getPosition(me.bar);
			if(me.options.direction=='vertical'){
				//var v= (((s.y-(p.y+9))/s.y)*(me.range[1]-me.range[0]))+me.range[0];
				var v= (((p.y+9)/s.y)*(me.range[1]-me.range[0]))+me.range[0];
				return v;
			}else{
				var v= (((p.x+9)/s.x)*(me.range[1]-me.range[0]))+me.range[0];
				return v;
			}
		}
		
		return this.state;
	},
	_partContraintsForState:function(state,part){
		//returns an object of css property->values for 
		//the moveable object (part) for the state returning null
		//or false causes animation loop to assume that the part is 
		//already at the correct position
		var me=this;
		if(part==me.knob){
			
			
			var s=me.bar.getSize();
			if(me.options.direction=='vertical'){

				var y=state;
				//var p=s.y-((y-me.range[0])/(me.range[1]-me.range[0]))*s.y;
				var p=((y-me.range[0])/(me.range[1]-me.range[0]))*s.y;
				var c= {
					'top':(p-9),
					'left':-8
					};
				return c;
			}else{
				
				var x=state;
				var p=((x-me.range[0])/(me.range[1]-me.range[0]))*s.x;
				var c= {
					'left':(p-9),
					'top':-8
				};
				return c;
				
			}
			
			
		}
		
		
		return false;
	},
	_labelsList:function(){
		var me=this;
		return {labels:me.valueLabel?[me.valueLabel]:[],formatters:[function(value, x){
			
			var prefix=me.options.displayPrefix&&typeOf(me.options.displayPrefix)=="function"?me.options.displayPrefix(x):me.options.displayPrefix;
			var suffix=me.options.displaySuffix&&typeOf(me.options.displaySuffix)=="function"?me.options.displaySuffix(x):me.options.displaySuffix;
			
			value.innerHTML='<table style="'+(me.options.direction=="vertical"?"height:"+me.options.length+'px;':'')+'><tr><td style="vertical-align: middle;">'+prefix+x+suffix+'</td></tr></table>';		

			return x;
		}]}; //you can provide a list of labels elements and formatters (optional) that will be used to update state change on stateChange automatically
	},
	_updateLimits:function(){
		//called if length units are in % and window changes size also called on a loop
		var me=this;

		if(me.options.direction=="vertical"){
			me.drag.options.limit.y=[-9, me.bar.getSize().y-9];
		}else{
			me.drag.options.limit.x=[-9, me.bar.getSize().x-9];
		}
	},

});