/**
*	HTML5 Media Player JavaScript Library
*	Creation Date: 		08/22/2012
*		
	@params:
		canvas: the DOM element id that is going to hold the mediaplayer.
		
*		pa: {width:int, height:int, file: {path:String,type:String of [video/ogg|video/mp4] } | Array of {path:String,type:String of [video/ogg|video/mp4] },
*                    autoplay:Boolean, showBeginEndTrackers: Boolean, markerColor: String,showMarkers: Boolean,
*                    pauseBeforeSwitch: Boolean, // whether you want to pause the video before the video switches to the next marker.
*			 markers: array of {
*					title: String,
*					time: int, // time in seconds where the marker starts
*					color: String, // This one overrides the default markerColor for this marker
*					length: int // Default 2
*				}}
*	
*	This library is used along with the tediaplayer.css file.
*	@css classes:
*			Video Container: 	html5_mediaplayer
*			Video:				video
*			Controller:			controller
*			Time Line: 			timeline
*			Progress:			progress
*			Time Tracker:		time_tracker
*			Buttons:			button
*			Play Button:		play
*			Pause Button:		pause
*			Forward Button:		forward
*			Backward Button:	backward
*			Previous Button:	prev
*			Next Button:		next
*			Begin Trackers:		begin_tracker
*			End Trackers:		end_tracker
*			Time Label:			time_label
**/

function HTML5MediaPlayer(canvas,pa){
	
	var div,video, so = this,controller,timeline,progress,tracker,playBtn, forwardBtn, backwardBtn,bTracker,showBeginEndTrackers,loaderDiv,nextBtn,showClipTracker,
		prevBtn, numOfBtns = 5, markers = [],markerDivs = [],markerColor = "#000",showMarkers=true,curMarkerPos = null,pauseBeforeSwitch= false,suspendCall = true,
		eTracker,timeLabel,timeHint,timeTD, cntH = 30,tlH = 5,space = 2,trBtnH = 15,trBtnW = 7,timeLblW = 80,dragEl,startTime = null,endTime = null, clipStartTime = null, clipEndTime = null;
	
	var init = function(){
		pa.width || (pa.width = 400)
		pa.height || (pa.height = 300)
		
    var st = "border-collapse:collapse;border: none;";
                
		div = document.createElement('div');
		div.className = "html5_mediaplayer";
		div.style.cssText = "position:relative;margin:0px;padding:0px;";
		document.getElementById(canvas).appendChild(div);
		
		video = document.createElement('video');
		video.className = "video";
		video.style.cssText = "position:absolute;top:0px;left:0px;width:100%;";
		video.preload = "auto";
		video.addEventListener("play", function(){doPlay(true);});
		video.addEventListener("pause", function(){doPlay(false);});
		video.addEventListener("timeupdate", function(){doTimeChanged();});
		video.addEventListener("durationchange", function(){repaint();})
		video.addEventListener("loadstart", function(){loaderDiv.style.display = "block";})
		video.addEventListener("loadeddata", function(){loaderDiv.style.display = "none";})
		div.appendChild(video);
		
		loaderDiv = document.createElement('div');
                loaderDiv.innerHTML = '<div class="video_loader" style="width:100%;height:100%;"></div>'
                loaderDiv.style.cssText = "position:absolute;top:0px;left:0px;width:100%;background:#000;opacity:0.5";
		div.appendChild(loaderDiv);
		
		controller = document.createElement('div');
		controller.className = "controller";
		controller.style.cssText = "position:absolute;bottom:0px;left:0px;width:100%;";
		div.appendChild(controller);
		
		var css = "position:relative;float:left;margin-left:"+space+"px;", css2 = css+"width:"+cntH+"px;height:"+(cntH-2)+"px;";
		
		playBtn = document.createElement('div');
		playBtn.className = "button play";
                playBtn.title = "Play";
		playBtn.style.cssText = css2;
		playBtn.addEventListener("click",function(){video[video.paused? 'play':'pause']();});
		controller.appendChild(playBtn);
		
		backwardBtn = document.createElement('div');
		backwardBtn.className = "button backward";
                backwardBtn.title = "Backward (5 Sec)";
		backwardBtn.style.cssText = css2;
		backwardBtn.addEventListener("click",function(){video.currentTime -= 5;});
		controller.appendChild(backwardBtn);
		
		forwardBtn = document.createElement('div');
		forwardBtn.className = "button forward";
                forwardBtn.title = "Forward (5 Sec)";
		forwardBtn.style.cssText = css2;
		forwardBtn.addEventListener("click",function(){video.currentTime += 5;});
		controller.appendChild(forwardBtn);
		
		prevBtn = document.createElement('div');
		prevBtn.className = "button prev";
                prevBtn.title = "Previous Segment";
		prevBtn.style.cssText = css2;
		prevBtn.addEventListener("click",function(){so.prev();});
		controller.appendChild(prevBtn);
		
		nextBtn = document.createElement('div');
		nextBtn.className = "button next";
                nextBtn.title = "Next Segment";
		nextBtn.style.cssText = css2;
		nextBtn.addEventListener("click",function(){so.next();});
		controller.appendChild(nextBtn);
		
		
		timeline = document.createElement('div');
		timeline.className = "timeline";
		timeline.style.cssText = css;
		timeline.addEventListener('mousedown',function(e){
			if(!e) e = window.event;
			var coor = getMouseCoor(e);
			video.currentTime = getStartTime() + Math.round(coor.x / timeline.offsetWidth * getDuration());
		})
		controller.appendChild(timeline);
		
		progress = document.createElement('div');
		progress.className = "progress";
		progress.style.cssText = css+"margin:0px;height:100%;";
		timeline.appendChild(progress);
		
		bTracker = document.createElement('div');
		bTracker.className = "begin_tracker"
		bTracker.style.cssText = "position:absolute;display:none;";
		bTracker.addEventListener('mousedown', doDragStart);
		controller.appendChild(bTracker);
		
		eTracker = document.createElement('div');
		eTracker.className = "end_tracker"
		eTracker.style.cssText = "position:absolute;display:none;";
		eTracker.addEventListener('mousedown', doDragStart);
		controller.appendChild(eTracker);
		
		tracker = document.createElement('div');
		tracker.className = "time_tracker";
		tracker.style.cssText = "position:absolute;display:none;";
		tracker.addEventListener('mousedown', doDragStart);
		controller.appendChild(tracker);
		
		timeLabel = document.createElement('div');
		timeLabel.className = "time_label"
		timeLabel.style.cssText = css2;
		timeLabel.innerHTML = '<table width="100%" height="100%" style="margin:0px;padding:0px;'+st+'"><tr style="'+st+'"><td align="center" valign="middle" class="time_label" style="text-align:center;'+st+'">00:00</td></tr></table>'
		controller.appendChild(timeLabel);
		timeTD = timeLabel.childNodes[0].rows[0].cells[0];
		
		timeHint = document.createElement('div');
		timeHint.className = "time_hint";
		timeHint.style.cssText = "display:none;position:fixed;z-index:99999;";
		document.body.appendChild(timeHint);
		
		repaint();
		so.setProp(pa);
	}
	
	this._ = function(ob, pa){
		for(p in pa) ob[p] = pa[p];
	}
	this.setProp = function(pa){
		for(p in pa){
			switch(p){
				case 'file':this.setFile(pa[p]);break;
				case 'autoplay':this.setAutoplay(pa[p]);break;
				case 'showBeginEndTrackers':this.setShowBeginEndTrackers(pa[p]);break;
				case 'startTime':this.setStartTime(pa[p]);break;
				case 'endTime':this.setEndTime(pa[p]);break;
				case 'markerColor':this.setMarkerColor(pa[p]);break;
				case 'markers':this.setMarkers(pa[p]);break;
				case 'showMarkers':this.setShowMarkers(pa[p]);break;
                                case 'pauseBeforeSwitch': this.setPauseBeforeSwitch(pa[p]); break;
                                // AMIN ***********
                                case 'showClipTracker': this.setShowClipTracker(pa[p]);break;
                                default:this[p] = pa[p];break;
			}
		}
	}
	
	this.setFile = function(file){
		pa.file = file;
		if(file instanceof Array){
                    for(var f in file) if(video.canPlayType(file[f].type)) video.src = file[f].path;
                }else{
                    if(video.canPlayType(file.type)) video.src = file.path;
                }
	}
	this.setAutoplay = function(v){
		pa.autoplay = v;
		video.autoplay = v?"autoplay":null;
		playBtn.className = "button play";
	}
	this.setShowBeginEndTrackers = function(v){
		showBeginEndTrackers = v;
		repaint();
	}
        this.setShowClipTracker = function (v) {
            showClipTracker = v;
            repaint();
        }
	this.setStartTime = function(v){
            if(v == null) return;
            setStartTime(getTimeFromStr(v));
            repaint();
	}
	this.setEndTime = function(v){
            if(v == null) return;
            setEndTime(getTimeFromStr(v));
            repaint();
	}
	this.setMarkerColor = function(v){
		markerColor = v;
		repaint();
	}
	this.setMarkers = function(v){
                // Sort the markers and make sure there are no null time markers.
                for(var l=v.length-1;l>=0;--l){
                    if(v[l].time == null) delete v[l];
                }
                markers = [];
                if(v.length > 0){
                    var i,j;
                    for(i=0,l=v.length;i<l;++i){
                        for(j=i-1;j>=0;--j){
                            if(v[i].time >= markers[j].time) break;
                        }
                        markers.splice(j+1, 0, v[i]);
                    }
                }
		repaint();
	}
	this.setShowMarkers = function(v){
		showMarkers = v;
		for(var i in markerDivs) markerDivs[i].style.display = v?"block":"none";
	}
        this.setCurrentMarkerPos = function(pos){
            if(pos < 0 || pos >= markers.length) return;
            suspendCall = false;
            video.currentTime = markers[pos].time;
        }
	this.setPauseBeforeSwitch = function(st){
            pauseBeforeSwitch = st;
        }
        
	this.play = function(){
                video.play();
		doPlay(true);
	}
	this.pause = function(){
                video.pause();
		doPlay(false);
	}
	this.next = function(){
           if(markers && curMarkerPos < markers.length-1){
                suspendCall = false;
		video.currentTime = markers[curMarkerPos+1].time;
           }
	}
	this.prev = function(){
           if(markers && curMarkerPos > 0 && markers.length > 1){
                suspendCall = false;
		video.currentTime = markers[curMarkerPos-1].time;
           }
	}
	
	
	this.getStartTime = function(){
		return startTime;
	}
        this.getClipStartTime = function(){
            return clipStartTime;
        }
        this.getStartTimeStr = function(){
		return formatTime(so.getStartTime(startTime));
        }
        this.getClipStartTimeStr = function(){
            return formatTime(so.getClipStartTime(startTime));
        }
        this.getClipEndTimeStr = function () {
            return formatTime(so.getClipEndTime());
        }
	this.getEndTime = function(){
		return endTime;
	}
        this.getClipEndTime = function(){
            return clipEndTime;
        }
	this.getEndTimeStr = function(){
		return formatTime(so.getEndTime());
        }
        this.getCurrentMarkerPos = function(){
            return curMarkerPos;
        }
        this.getTotalMarkers = function(){
            return markers.length;
        }
        this.getMarkers = function(){
            return markers;
        }
        
	var repaint = function(){
                so._(div.style,{width:pa.width + "px",height:pa.height + "px"});
                so._(controller.style,{height:cntH+"px",marginBottom:"2px"});
                video.style.height = loaderDiv.style.height = (pa.height - cntH - 10) + "px";

                var tlW = (pa.width - cntH * numOfBtns - timeLblW - (space * (numOfBtns+1)) - (trBtnW<<1));
                so._(timeline.style,{height:tlH + "px", width: tlW+"px",
                                                                top: ((cntH>>1) - (tlH>>1))+'px', margin:"0px "+trBtnW+"px"});
                so._(tracker.style,{width:trBtnW+"px",height: trBtnH+"px",top: ((cntH>>1) - (trBtnH>>1))+'px'});
                so._(timeLabel.style,{width:(timeLblW-5)+"px"});

                if(!video.duration){
                        loaderDiv.style.display = "block";
                        return;
                }
                
                var st = (showBeginEndTrackers||showClipTracker)? "block" : "none";
                so._(bTracker.style,{width:trBtnW+"px",height: trBtnH+"px",bottom:"0px",display:st});
                so._(eTracker.style,{width:trBtnW+"px",height: trBtnH+"px",bottom:"0px",display:st});
                so._(tracker.style,{display:"block"});
                
                
                
                
                for(var i in markerDivs) timeline.removeChild(markerDivs[i]);
                markerDivs = [];
                if(markers.length){
                        for(var i in markers){ 
                            var m = document.createElement('div');
                            m.style.cssText = "display:"+(showMarkers?"block":"none")+";position:absolute;opacity:0.8;top:0px;height:100%;width:"+
                                                                    (markers[i].length || 2)+"px;background:"+(markers[i].color || markerColor)+
                                                                    ";left:"+Math.round((timeline.offsetWidth * (markers[i].time - getStartTime())/getDuration()))+"px;";
                            markerDivs.push(m);
                            timeline.appendChild(m);
                        }
                }

                loaderDiv.style.display = "none";
                endTime === null && setEndTime(pa.endTime || video.duration);
                startTime === null && setStartTime(pa.startTime || 0);
                clipEndTime === null && setClipEndTime(endTime);
                clipStartTime === null && setClipStartTime(startTime);
                setTrackerPosition(bTracker);
                setTrackerPosition(eTracker);
                setTrackerPosition(tracker);
                video.currentTime = startTime;
            },
            getTimeFromStr = function(v){
                if(v == null ) return null;
                if(+v || +v === 0) return +v;
                var timeInfo = v.split(':');
                var i=timeInfo.length-1,t=0,f=1;
                if(i > 2 || i < 0) return 0;
                for(;i>=0;--i) {
                    v = +(timeInfo[i]);
                    if(!v && v !== 0) return 0;
                    t += v*f;
                    f *= 60;
                }  
                return t;
            },
            setStartTime = function(v){
                if(video.duration <= 0 || v == null) return;
                v < 0 && (v = 0);
                startTime = v;
                so.onBeginTimeChanged && so.onBeginTimeChanged(so);
            },
            setEndTime = function(v){
                if(video.duration <= 0 || v == null) return;
                v < 0 && (v = 0);
                endTime = v;
                so.onEndTimeChanged && so.onEndTimeChanged(so);
            },
            setClipStartTime = function(v){
                if(video.duration <= 0 || v == null) return;
                v < 0 && (v = 0);
                clipStartTime = v;
                so.onBeginTimeChanged && so.onBeginTimeChanged(so);
            },
            setClipEndTime = function(v){
                if(video.duration <= 0 || v == null) return;
                v < 0 && (v = 0);
                clipEndTime = v;
                so.onEndTimeChanged && so.onEndTimeChanged(so);
            },
            getEndTime = function(){
                if(showBeginEndTrackers) return video.duration;
                return endTime;
            },
            getStartTime = function(){
                if(showBeginEndTrackers) return 0;
                return startTime;
            },
            
            getCurrentTime = function(){
                    return video.currentTime - getStartTime();
            },
            getDuration = function(){
                    return getEndTime() - getStartTime();
            },
            setTrackerPosition = function(elm, pos){
                var d , ct, tl = timeline.offsetWidth;
                if(elm == bTracker){
                    d = video.duration;
                    ct = startTime;
                    pos == null && (pos = (showBeginEndTrackers) && Math.round(tl * ct / d) || 0);
                }else if(elm == eTracker){
                    d = video.duration;
                    ct = endTime;
                    pos == null && (pos = (showBeginEndTrackers) && Math.round(tl * ct / d) || timeline.offsetWidth);
                }else if(elm == tracker){
                    d = getDuration();
                    ct = getCurrentTime();
                    pos == null && (pos = Math.round(tl * ct / d));
                }
                pos || pos === 0 || (pos = progress.offsetWidth);
                if(pos < 0) pos = 0;
                else if(pos > timeline.offsetWidth) pos = timeline.offsetWidth;
                if((elm == bTracker || elm == tracker) && pos > eTracker.pos) pos = eTracker.pos;
                if((elm == eTracker || elm == tracker) && pos < bTracker.pos) pos = bTracker.pos;

                elm.pos = pos;
                var left = (cntH + space) * numOfBtns + (trBtnW>>1);
                elm.style.left = (left+pos)+"px";
            },
            getMouseCoor = function(e){
                    var scrollX = 0 , scrollY = 0, coor = {x:e.clientX,y:e.clientY};
                    if( self.pageYOffset ){
                            scrollX = self.pageXOffset;
                            scrollY = self.pageYOffset;
                    }else if( document.documentElement && document.documentElement.scrollTop ){
                            scrollX = document.documentElement.scrollLeft;
                            scrollY = document.documentElement.scrollTop;
                    }else if( document.body ){
                            scrollX = document.body.scrollLeft;
                            scrollY = document.body.scrollTop;
                    }
                    coor.x += scrollX;
                    coor.y += scrollY;
                    var p = timeline;
                    while(p){
                            coor.x -= p.offsetLeft;
                            coor.y -= p.offsetTop;
                            p = p.offsetParent;
                    }
                    return coor;
            },
            updateTimeDisplay = function(){
              timeTD.innerHTML = formatTime(video.currentTime) +" / "+formatTime(getEndTime());
            },
            formatTime = function(seconds) {
              seconds = Math.round(seconds);
              minutes = Math.floor(seconds / 60);
              minutes = (minutes >= 10) ? minutes : "0" + minutes;
              seconds = Math.floor(seconds % 60);
              seconds = (seconds >= 10) ? seconds : "0" + seconds;
              return minutes + ":" + seconds;
            },
            updateHintDisplay = function(e){
                    
                    timeHint.innerHTML = formatTime(getStartTime() + dragEl.pos / timeline.offsetWidth * getDuration());
                    so._(timeHint.style,{left:e.clientX+"px",top: (e.clientY+16)+"px"});
            },
            findMarker = function(v,start,end){
                if(start > end) return null;
                var mid = start + ((end - start) >> 1), t = markers[mid].time;
                if(v == t || mid < markers.length - 1 && v > t && v < markers[mid+1].time || mid == markers.length - 1 && v > t ) return mid;
                if(v < t) return findMarker(v,start,mid-1);
                return findMarker(v,mid+1,end);
            },
            doPlay = function(st){
                    playBtn.className = "button "+(st?"pause":"play");
            },
            doTimeChanged = function(){
                
                    var et = Math.min(endTime,clipEndTime);
                    var st = Math.max(startTime,clipStartTime);
                    if(video.currentTime > et){video.pause(); video.currentTime = et; return false;}
                    if(video.currentTime < st){video.pause(); video.currentTime = st;  return false;} 
                  
                    var w = Math.round(timeline.offsetWidth* getCurrentTime() / getDuration());
                    progress.style.width = w+"px";
                    !tracker.dragging && setTrackerPosition(tracker,w);
                    updateTimeDisplay();
                    
                    var ml = markers.length;
                    if(ml > 0){
                        var ct = video.currentTime,i = findMarker(ct,0,markers.length-1);
                        if(i != curMarkerPos){
                            var tpos = curMarkerPos;
                            
                            if(suspendCall && tpos != null && tpos > -1 && i > curMarkerPos && i < ml-2 && pauseBeforeSwitch && !markers[tpos].paused && ct <= markers[i].time+0.5){
                                video.pause();
                                markers[tpos].paused = 1;
                            }else{
                                if(suspendCall && tpos != null && tpos > -1){
                                    if(markers[tpos].paused == 1){ 
                                        markers[tpos].paused = 2; 
                                        return true; 
                                    }else markers[tpos].paused = false;
                                }
                                suspendCall = true;
                                curMarkerPos = i;
                                so.onMarkerPosChanged && so.onMarkerPosChanged(so,tpos, curMarkerPos);
                            }
                        }
                    }
                    return true;
            },
            doDragStart = function(e){
                    if(!e) e = window.event;
                    var coor = getMouseCoor(e);
                    so._(document.body.style,{"mozUserSelect": 'none',"webkitUserSelect": 'none', "msUserSelect": 'none'});
                    document.onselectstart = function(){return false;}
                    this.startPos = coor.x;
                    this.startLeft = this.pos;
                    this.dragging = true;
                    dragEl = this;
                    updateHintDisplay(e);
                    timeHint.style.display = "block";
                    window.addEventListener('mousemove', doDraging);
                    window.addEventListener('mouseup', doDragEnd);
                    e.preventDefault && e.preventDefault();
                    return false;
            },
            doDraging = function(e){
                    if(!e) e = window.event;
                    var coor = getMouseCoor(e);
                    setTrackerPosition(dragEl,dragEl.startLeft + coor.x - dragEl.startPos);
                    var t = getStartTime() + Math.round(dragEl.pos / timeline.offsetWidth * getDuration());
                    if(showClipTracker){
                        dragEl == bTracker && setClipStartTime(t);
                        dragEl == eTracker && setClipEndTime(t);
                    }else{
                        dragEl == bTracker && setStartTime(t);
                        dragEl == eTracker && setEndTime(t);
                    }
                    updateHintDisplay(e);
                    e.preventDefault && e.preventDefault();
                    return false;
            },
            doDragEnd = function(e){
                    if(!e) e = window.event;
                    delete dragEl.startPos;
                    window.removeEventListener('mousemove',doDraging);
                    window.removeEventListener('mouseup',doDragEnd);
                    doDragFinalize();
                    delete dragEl.dragging;
                    dragEl = null;
                    timeHint.style.display = "none";
                    document.onselectstart = null;
                    so._(document.body.style,{"-moz-user-select": 'auto',"webkitUserSelect": 'auto', "msUserSelect": 'auto'});
            },
            doDragFinalize = function(){
                    if(dragEl == tracker){
                        video.currentTime = Math.round(getStartTime() + dragEl.pos / timeline.offsetWidth * getDuration());
                    }else{
                        setTrackerPosition(dragEl,(Math.round(getStartTime() + dragEl.pos / timeline.offsetWidth * getDuration()) - getStartTime()) * timeline.offsetWidth / getDuration());
                    }
            }
	
	//Events
	this.onBeginTimeChanged = null; // params: (sender: HTML5MediaPlayer)
	this.onEndTimeChanged = null; // params: (sender: HTML5MediaPlayer)
	this.onNext = null; // params: {sender: HTML5MediaPlayer, time: int, markerTitle: String}
	this.onPrev = null; // params: {sender: HTML5MediaPlayer, time: int, markerTitle: String}
	this.onMarkerPosChanged = null; // params: {sender:HTML5MediaPlayer, oldPos, newPos}
	init();
}