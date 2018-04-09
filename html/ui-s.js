var UISwitchControl=new Class({
	Extends:UIControl,
	knob:null,
	initialize:function(element, options)
	{
	
		var initialOptions=Object.append({
		slideImage:false,
		slideImageWidth:18,
		slideImageHeight:15,
		slideImageKnobTopLeft:[1,1],		//expecting a border to push it down. and to the right. but only show border on right.
		slideImageKnobBottomRight:[20,17],  //border is still expected, but it only pushes right and down, not from bottom left. 
											//so here we give extra space to acounnt for a 1px border on all sides. 
		slideLimitX:false,
		slideLimitY:false,
		scaleControl:false,
		peepholeWidth:35, 
		peepholeHeight:15,
		steps:1, //steps can be an integer, or if 0, a linear value based on the pixel location is used
		increment:1, //increment number of pixels to move at a time. 
		axis:"horizontal" //not used!
				
	},options);
		
		initialOptions.knobStyles=Object.append({
			'position':'absolute'
		}, options.knobStyles);
		
		initialOptions.peepholeStyles=Object.append({
			//'overflow':'hidden',
			'position':'relative'
		}, options.peepholeStyles);
		
		this.initialOptions=Object.append({},initialOptions);
		this.parent(element, initialOptions); //parent calls this._render!
	},
	_render:function(container){
		var me=this;
		if(!me.options.peepholeWidth){
			me.options.peepholeWidth=me.options.slideImageKnobBottomRight[0];
		}
		
		var peephole=new Element('div', {"class":"ui-switch"});
		peephole.setStyle('height', me.options.peepholeHeight+'px');
		peephole.setStyle('width', me.options.peepholeWidth+'px');
		peephole.setStyles(me.options.peepholeStyles);
		me.peephole=peephole;
		
		var initialPostion=me._contraintsForState(me.state);
		var slideImage=me.options.slideImage?(new Element('img', {src:me.options.slideImage})):(new Element('div'));
		slideImage.addClass('ui-ctrl-handle');

		slideImage.setStyle('left', initialPostion[0]+'px');
		slideImage.setStyle('top', initialPostion[1]+'px');
		slideImage.setStyle('width', me.options.slideImageWidth+'px');
		slideImage.setStyle('height', me.options.slideImage?'auto':me.options.slideImageHeight+'px');
		slideImage.setStyles(me.options.knobStyles);
		
		container.appendChild(peephole);
		peephole.appendChild(slideImage);
		me.knob=slideImage;
		if(me.state){me.element.addClass('active');}
		me.element.addClass('Boolean');
	},
	_disableUserInteraction:function(){
		var me=this;
		me.peephole.removeEvents();
		me.knob.removeEvents();
		me.knob.setStyle('opacity','0.4');
		me.dragMove=null;	
		me.peephole.addClass('disabled');
	},
	_enableUserInteraction:function(){
		var me=this;
		var slideImage=me.knob;
		me.knob.setStyle('opacity','1');
		var dragMove=new Drag(slideImage,{
			limit:{
				'x': me.options.slideLimitX, 
				'y': me.options.slideLimitY //no vertical control
			},
			onStart:function(){
				me.element.addClass('dragging');
			},
			onComplete: function(el){ 	//el -> drag-able element (not used)
				me.toggle();
				me.element.removeClass('dragging');
			}
		});
		me.peephole.addEvent('click',function(){me.toggle();});
		me.dragMove=dragMove;
		me.peephole.removeClass('disabled');
	},
	setScale:function(value){
		var me=this;
		me.options=Object.merge({},
			me.options,
				Object.merge({},{
					slideImage:false,
					slideImageWidth:130,
					slideImageHeight:22,
					slideImageKnobTopLeft:[48,2],
					slideImageKnobBottomRight:[80,21],
					slideLimitX:false,
					slideLimitY:false,
					scaleControl:false,
					peepholeWidth:75, 
					peepholeHeight:20,
					steps:1, //steps can be an integer, or if 0, a linear value based on the pixel location is used
					increment:1, //increment number of pixels to move at a time. 
					axis:"horizontal" //not used!
					},
				{scaleControl:value})
			);

		me.options.slideLimitX=false;
		me.options.slideLimitY=false;
		me.element.removeChild(me.peephole);
		me.knob=null;
		me.peephole=null;
		me.stateMap=null;
		
		me._generateStateMap();
		me._render(me.element);
		//JSConsole(['scaled slider', Object.merge({},me.options, {})]);
		
	},
	_generateStateMap:function(){
		var me=this;
		if(me.options.scaleControl){
			if(me.options.slideImageWidth){
				me.options.slideImageWidth=Math.round(me.options.slideImageWidth*me.options.scaleControl);
			}
			if(me.options.slideImageHeight){
				me.options.slideImageHeight=Math.round(me.options.slideImageHeight*me.options.scaleControl);
			}
			if(me.options.slideImageKnobTopLeft){
				
				me.options.slideImageKnobTopLeft[0]=Math.round(me.options.slideImageKnobTopLeft[0]*me.options.scaleControl);
				me.options.slideImageKnobTopLeft[1]=Math.round(me.options.slideImageKnobTopLeft[1]*me.options.scaleControl);
				//console.debug(["MooSlider Top Left",[Math.round(me.options.slideImageKnobTopLeft[1]*me.options.scaleControl),me.options.slideImageKnobTopLeft[1],me.options.scaleControl]]);

			}
			if(me.options.slideImageKnobBottomRight){
				me.options.slideImageKnobBottomRight[0]=me.options.slideImageKnobBottomRight[0]*me.options.scaleControl;
				me.options.slideImageKnobBottomRight[1]=me.options.slideImageKnobBottomRight[1]*me.options.scaleControl;
			}
			
			if(me.options.slideLimitX){
				me.options.slideLimitX=Math.round(me.options.slideLimitX*me.options.scaleControl);
			}
			if(me.options.slideLimitY){
				me.options.slideLimitY=Math.round(me.options.slideLimitY*me.options.scaleControl);
			}
			if(me.options.peepholeWidth){
				me.options.peepholeWidth=Math.round(me.options.peepholeWidth*me.options.scaleControl);
			}
			if(me.options.peepholeHeight){
				me.options.peepholeHeight=Math.round(me.options.peepholeHeight*me.options.scaleControl);
			}
		}
		
		if(!me.options.slideLimitX){

			var xOffset=0;
			var xWidth=me.options.slideImageKnobBottomRight[0]-me.options.slideImageKnobTopLeft[0];
			if(me.options.peepholeWidth){
					xOffset=me.options.peepholeWidth-(xWidth);
			}
			me.options.slideLimitX=[-me.options.slideImageKnobTopLeft[0], xOffset]; //left limit is always knobleft knob right may need an offset
		}
		if(!me.options.slideLimitY){
			/* 
			 * not needed.
			var yOffset=0;
			if(me.options.peepholeHeight){
				var yHeight=me.options.slideImageKnobBottomRight[1]-me.options.slideImageKnobTopLeft[1];
			}
			*/
			
			me.options.slideLimitY=[-me.options.slideImageKnobTopLeft[1], -me.options.slideImageKnobTopLeft[1]];
		}
		var stateMap={x:[me.options.slideLimitX[0],me.options.slideLimitX[1]], y:[me.options.slideLimitY[0], me.options.slideLimitY[1]]};
		me.stateMap=stateMap;
	},
	_contraintsForState:function(state){
		var me=this;
		return [me.stateMap.x[me.range.indexOf(state)], me.stateMap.y[me.range.indexOf(state)]];
	},
	_stateChangeTo:function(state, suppressEvents){
		return this._animateStateChangeTo(state,suppressEvents);
	},
	_animateStateChangeTo:function(state, suppressEvents){
		var me=this;

		var pos=me._contraintsForState(state);
		
		var slide=new Fx.Tween(me.knob,{property:'left', duration:'short'});
		//new Fx.Tween(me.knob, 'left', {transition: Fx.Transitions.Elastic.easeOut, duration:500});
		me.element.addClass('transition');
		slide.start(pos[0]).chain(function(){
			me.element.removeClass('transition');
			me.state=state;
			if(me.state){
				me.element.addClass('active');
			}else{
				me.element.removeClass('active');
			}
			if(!suppressEvents){
				me.fireEvent('change', me.state);
				if(me.state===true||me.steps==1&&me.state===1){
					me.fireEvent('enable');
					//window.parent.console.debug(me.element);	
				}
				if(me.state===false||me.steps==1&&me.state===0){
					me.fireEvent('disable');
				
				}
			}
		});
		
		return state;
	},
	toggle:function(){
		this._toggle();
	}
});