var UIControl=new Class({
	Implements:Events,
	
	
	
	initialize:function(element, options){
		var me=this;
		me.enabled=false;
		me.isInitializing=true;
		me.element=element;
		me.options=Object.append({
			state:true,
			enabled:true,
			range:[false,true],
			stateMap:null
		},options);
		me.state=me.options.state;
		me.range=me.options.range;
		me.stateMap=me.options.stateMap;
		me._generateStateMap();
		me._render(element);
		me.isRespondingToTouches=false;
		me.isAnimating=false;
		//me._setState(me.state, true); //position moveable parts.
		me._stateChangeTo(me.state, true);
		me._updateLabelsWithState(me.state);
		
		if(me.options.enabled)me.enable();
		
		if(me.options.lengthUnit=='%'){
			window.addEvent('domready',function(){
				var lastSize=null;
				var sizeChanged=function(last,current){
					if(last==null)return true;
					if(last!=current)return true;
					if(typeOf(last)=='object'&&typeOf(current)=='object'){
						if(last.x!=current.x||last.y!=current.y)return true;
					}
					return false;
				};
				var update=function(){
					var size=me._getSize();
					
					if(sizeChanged(lastSize,size)){
						me._checkResize();
					}
					lastSize=size;
					
				};
				var loop=null;
				loop=function(){
					update();			
					if(me.options.lengthUnit=='%'){
						setTimeout(loop,1000);
					}
				};
				setTimeout(loop,250);
				window.addEvent('resize', function(){
					update();
					setTimeout(update,250);
				});
				
			});
		}
		setTimeout(function(){me._checkResize();},250);
		me.isInitializing=false;
	},
	_checkResize:function(){
		var me=this;
		if((!me.isRespondingToTouches)&&(!me.isAnimating)){
			me._updateStateMap();
			me._updateDrawingDimensions();
			me._updateLimits();
			me._setState(me.state, true);
			return true;
		}
		return false; //unable to resize right now.
	},
	_statesEqualTo:function(a, b){
		if(a==b)return true;
		return false;
	},
	_setState:function(state, suppressEvents){
		
		var me=this;
		
			if(me._canChangeStateTo(state)){
				var value=me._formatInputValue(state);
				if(me._statesEqualTo(me.state, value)){
					me._stateChangeTo(value, suppressEvents);
				}else{
					me._animateStateChangeTo(value, suppressEvents);
				}
			}else{
				throw 'UIControl: invalid value sent to _setState';
			}
		
	},
	
	setValue:function(v){
		this._setState(v, false);	
	},
	/**
	 * @returns formatted value describing current control state, although internally the state
	 * may be formatted differently
	 */
	getValue:function(){
		return this._formatOutputValue(this.state);
	},
	/**
	 * alias 
	 * @returns getValue()
	 */
	getState:function(){
		return this.getValue();
	},
	
	
	/**
	 * should only available if range is a set of values. for linear sliders this will not work.
	 * UIButton, (and UIOptionListSlider provides it externally) can use this method.
	 */
	_toggle:function(){
		var me=this;
		me._animateStateChangeTo(me.range[(me.range.indexOf(me.state)+1) % me.range.length]);
	},
	
	
	_render:function(container){
		alert('UIControl _render should be implemented by child class: '+$H(window).keyOf(this.constructor));
	},
	_animationOptions:function(toState){
		return {duration: 300, transition: Fx.Transitions.Sine.easeOut};
	},
	_canChangeStateTo:function(state){
		return true;
	},
	_formatInputValue:function(state){
		return state;
	},
	_formatOutputValue:function(state){
		return state;
	},
	//optional methods to react to possible changes.
	_willAnimateStateChangeTo:function(state){},
	_willChangeStateTo:function(state){},
	_didAnimateStateChangeFrom:function(state){},
	_didChangeStateFrom:function(state){},
	
	_animateStateChangeTo:function(state, suppressEvents){
		
		//override me to provide custom state change animations
		
		var me=this;
		var parts=me._moveablePartsList();
		if(parts&&parts.length){
			me._willChangeStateTo(state);
			me._willAnimateStateChangeTo(state);
			
			var effects=[];
			var fxProperties=[];
			Array.each(parts,function(part){
				
				var constraints=me._partContraintsForState(state,part);
				if(constraints){
					
					effects.push(new Fx.Morph(part, me._animationOptions(state)));
					fxProperties.push(constraints);
					
				}else{
					// assume that the part is already at the correct
					// position identified by contraints
				}

			});
			var previous=me.state;
			me.state=state;
			if(effects.length){
				me._willAnimateStateChangeTo(state);
				me.isAnimating=true;
				
				Array.each(effects,function(fx,i){
					if(i+1==effects.length){
						fx.start(fxProperties[i]).chain(function(){
							//last effect
							me.isAnimating=false;
							me._didAnimateStateChangeFrom(state);
							me._updateLabelsWithState(me.state);
						});
					}else{
						fx.start(fxProperties[i]);
					}
				});	
			}else{
				
				
			}
			
			
			if(!me._statesEqualTo(previous, state)&&!suppressEvents){
				me._updateLabelsWithState(me.state);
				me.fireEvent('change', [me.state]);
			}
			if(!me.isInitializing)me._updateLimits();
			me._didChangeStateFrom(previous);
			//me._didAnimateStateChangeFrom(previous);
			
		}else{
			_stateChangeTo(state, suppressEvents);
		}
		return state;
	},
	_stateChangeTo:function(state, suppressEvents){
		//override me 
		var me=this;
		me._willChangeStateTo(state);
		var parts=me._moveablePartsList();
		if(parts&&parts.length){
			Array.each(parts,function(part){
				
				var constraints=me._partContraintsForState(state,part);
				if(constraints){
					part.setStyles(constraints);
				}else{
					//assume that the part is already at the correct position identified by 
					//contraints
				}

			});
			
		}
		var previous=me.state;
		me.state=state;
		if(!me._statesEqualTo(previous, me.state)&&!suppressEvents){
			me._updateLabelsWithState(me.state);
			me.fireEvent('change', [me.state]);
		}
		if(!me.isInitializing)me._updateLimits();
		me._didChangeStateFrom(previous);
		return state;
	},
	_generateStateMap:function(){
		
		//this is a helper method. it is called at initialization and 
		//should be called if dimensions or range of control changes.
		//override me if you want to cache position calculation results
		
		//it might not be posible to detect dimensions during initial.
	},
	
	_updateStateMap:function(){},
	_getSize:function(){
		var me=this;
		return me.element.getSize().x;
	},
	_updateDrawingDimensions:function(){},
	_updateLimits:function(){},
	
	_moveablePartsList:function(){
		return []; //no moveable parts will likely disable animation (and interactivity)
	},
	_labelsList:function(){
		return {labels:[],formatters:false}; //you can provide a list of labels elements and formatters (optional) that will be used to update state change on stateChange automatically
	},
	_updateLabelsWithState:function(state){
		
		//will be called automatically on _stateChangeTo
		var me=this;
		var value=state;
		if(value==null)value=me.state;
		var list=me._labelsList();
		if(list['labels']&&list.labels.length){
			Array.each(list.labels, function(label, i){
				if(list.formatters&&list.formatters.length>i){
					label.setAttribute('state', list.formatters[i].bind(me)(label, me._formatOutputValue(value)));
				}else{
					label.setAttribute('state', me._formatOutputValue(value));
				}
				
			});
		}
	},
	_stateWithPart:function(part){
		//return the state value calculated
		//by the current parts position.
		//it is assumed that only one part will move at a time
		return this.state;
	},
	
	_partContraintsForState:function(state,part){
		//returns an object of css property->values for 
		//the moveable object (part) for the state returning null
		//or false causes animation loop to assume that the part is 
		//already at the correct position
		return false;
	},
	
	isHorizontal:function(){
		var me=this;
		if(me.options.direction&&me.options.direction=='vertical')return false;
		return true;
	},
	
	isEnabled:function(){
		return this.enabled;
	},
	
	enable:function(){
		var me=this;
		if(!me.enabled){
			me.enabled=true;
			me._enableUserInteraction();
			me.fireEvent('interaction.enabled');
		}
	},
	_enableUserInteraction:function(){	
		//override me
	},
	_disableUserInteraction:function(){	
		//override me
	},
	disable:function(){
		var me=this;
		if(me.enabled){
			me.enabled=false;
			me._disableUserInteraction();
			me.fireEvent('interaction.disabled');
		}
	}
});
