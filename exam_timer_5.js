$(document).ready(function () {
    let timers = new Array();
    let seconds_toggle = "show";
    let showseconds = false;
    let paused = false;
    let pausedtime = 0;
    let scheduledStart = null;
    let extraTimeEnabled = false;
    let scheduledInterval = null;
    let examtime, extraexamtime, readingtime, examtitle, readingflag;
    
    const clock_options = {
        format: '%I:%M %p', // 12-hour with am/pm
    };
    
    $('.timebox').hide();
    $('.jclock').jclock(clock_options);
    
    $('#setup').modal('show');
    
    $("#modal-close-button").live('click', function() {
        examhours = parseInt($("#examtime_hours").val(), 10);
        if(isNaN(examhours)) {examhours = 0;}
        examminutes = parseInt($("#examtime_minutes").val(), 10);
        if(isNaN(examminutes)) {examminutes = 0;}        
        readingminutes = parseInt($("#readingtime_minutes").val(), 10);
        if(isNaN(readingminutes)) {readingminutes = 0;}
        
        showseconds = $("#showseconds").is(':checked');
        extraTimeEnabled = $("#extra-time-toggle").is(':checked');
        
        // Handle scheduled start time
        const scheduledTimeInput = $("#scheduled-time").val();
        if (scheduledTimeInput) {
            const [hours, minutes] = scheduledTimeInput.split(':');
            scheduledStart = moment().set({
                hours: parseInt(hours),
                minutes: parseInt(minutes),
                seconds: 0,
                milliseconds: 0
            });
            
            if (scheduledStart.isBefore(moment())) {
                scheduledStart = null;
            }
        } else {
            scheduledStart = null;
        }
        
        // Calculate exam time with extra time if enabled
        examtime = examhours * 60 * 60 + examminutes * 60;
        if (extraTimeEnabled) {
            extraexamtime = Math.floor(examtime * 1.25);
        }
        
        readingtime = readingminutes * 60;
        examtitle = $("#exam-title-entry").val();
        
        $("#remainingTime").css("color", "#fff");                    
        $("#exam-title").text(examtitle);
        
        setupInitialState();
    });
    
    function setupInitialState() {
        $("#buttonStart").removeClass('disabled');
        $("#buttonSetup").removeClass('disabled');                
        $("#buttonReset").addClass('disabled');
        $("#buttonPause").show();
        
        if (scheduledStart) {
            $("#stage_title").text("Scheduled to start at: " + scheduledStart.format("h:mm A"));
            $("#buttonStart").text("Cancel Scheduled Start");
            initializeScheduledStart();
        } else if (readingminutes > 0) {
            $("#stage_title").text("Reading Time:");
            $("#buttonStart").text("Start Reading Time");
            readingflag = true;
            initializeExamTimer(readingtime, "reading");
        } else {
            $("#stage_title").text("Exam Time:");
            $("#buttonStart").text("Start Exam Time");
            readingflag = false;
            initializeExamTimer(examtime, "exam");
        }
        
        $('.timebox').fadeIn();
    }
    
    function initializeScheduledStart() {
        clearInterval(scheduledInterval);
        
        scheduledInterval = setInterval(() => {
            const now = moment();
            const timeUntilStart = scheduledStart.diff(now);
            
            if (timeUntilStart <= 0) {
                clearInterval(scheduledInterval);
                startExam();
                return;
            }
            
            // Update countdown display
            const duration = moment.duration(timeUntilStart);
            const hours = Math.floor(duration.asHours());
            const minutes = duration.minutes();
            const seconds = duration.seconds();
            
            $("#remain_hours").html(hours + "<span class='tiny'> h</span>").show();
            $("#remain_min").html(minutes + "<span class='tiny'> min</span>");
            $("#remain_sec").html(seconds + "<span class='tiny'> s</span>");
        }, 1000);
        
        timers.push(scheduledInterval);
    }
    
    function startExam() {
        scheduledStart = null;
        clearInterval(scheduledInterval);
        
        if (readingminutes > 0) {
            $("#stage_title").text("Reading Time:");
            readingflag = true;
            initializeExamTimer(readingtime, "reading");
            $("#buttonStart").text("Start Reading Time");
        } else {
            $("#stage_title").text("Exam Time:");
            readingflag = false;
            initializeExamTimer(examtime, "exam");
            $("#buttonStart").text("Start Exam Time");
        }
        
        startTime = moment();
        updateRemainingTime();
    }
    
    $("#buttonStart").live('click', function() {
        if (scheduledStart) {
            // Cancel scheduled start
            scheduledStart = null;
            clearInterval(scheduledInterval);
            for (let timer of timers) {
                clearTimeout(timer);
            }
            timers = [];
            $("#stage_title").text("Scheduled start cancelled");
            $("#buttonStart").text("Start Exam Time");
            setupInitialState();
            return;
        }

        pausedtime = 0;
        $("div.footer").fadeOut();
        
        if (readingminutes > 0) {
            $("#buttonStart").addClass('disabled');
            $("#buttonSetup").addClass('disabled');                
            $("#buttonReset").removeClass('disabled');
            $("#buttonPause").removeClass('disabled');                                    
            readingminutes = 0;
            startTime = moment();            
        } else {
            if (readingflag == true) {
                $("#stage_title").text("Exam Time:").css('color', 'white');
                readingflag = false;            
            }
            
            startTime = moment();
            finishTime = moment(startTime).add(examtime, 's');
                    
            $("#start-time-div").show();
            $("#fin-time-div").show();
            $("#start-time").html(moment(startTime).format("h:mm a"));        
            $("#fin-time").html(moment(finishTime).format("h:mm a"));            
            $("#buttonStart").addClass('disabled');
            $("#buttonPause").removeClass('disabled');                        
            $("#buttonSetup").addClass('disabled');            
            $("#buttonReset").removeClass('disabled');
        }        
        
        updateRemainingTime();
//		timers.push(setTimeout(updateRemainingTime(), 1000));
	});
	
	$("#buttonReset").live('click',function() {
			for (var i = 0; i < timers.length; i++)
				{
					clearTimeout(timers[i]);
				}
			$("#buttonStart").hide();
			$("#buttonPause").hide();						
			$("#buttonSetup").removeClass('disabled');				
			$("#buttonReset").addClass('disabled');
			seconds_toggle = "show";
			hour = 0;
			mins = 0;
			secs = 0;
			displayRemainingTime();
			$("#start-time-div").hide();
			$("#fin-time-div").hide();
			$("div.footer").fadeIn();			
			$('#setup').modal('show');
	});				
	$("#buttonPause").live('click',function() {
		if (paused == true) {
			paused = false;
			pausedtime = pausedtime + (new Date().getTime() - pauseStarttime);
			
			updatedFinishTime = moment(finishTime).add(pausedtime,'ms');
			$("#fin-time").html(moment(updatedFinishTime).format("h:mm a"));
			$("#fin-time").effect("highlight", {}, 1500);			
			timers.push(setTimeout(updateRemainingTime(), 1000));
			$("#buttonPause").html('<i class="icon-pause icon-white"></i> Pause');
		} else {
			pauseStarttime = new Date().getTime();			
			paused = true;
			for (var i = 0; i < timers.length; i++)
			{
				clearTimeout(timers[i]);
			}						
			$("#buttonPause").html('<i class="icon-pause icon-white"></i> Continue');
		}
	});
	
	$(window).on('beforeunload', function(){
	  return 'Leave the timer?';
	});


	// http://svn.terracotta.org/svn/forge/projects/exam/tags/release-1.0.1/src/main/webapp/js/examTimer.js

	var hour = 0;
	var mins = 0;
	var secs = 0;

	function initializeExamTimer(remainingTimeInSeconds) {
		currsec = remainingTimeInSeconds;
		currmillisec = currsec*1000;
		elapsed = 0;
		displayRemainingTime();
	}

	function updateRemainingTime() {
		var examFinished = false;
		
		var diff = (new Date().getTime() - startTime - pausedtime) - elapsed;
		$('#diffp').show();
		$('#diff').text(diff);		

		currmillisec -= 1000;
		elapsed += 1000;
		
		/* inefficient (repeats) */
		if (showseconds == false) {
			if (elapsed >= 28000 && currmillisec > 121000 && seconds_toggle == "show") {
				toggleseconds("hide");					
			}
		}
		if (currmillisec <= 121000 && seconds_toggle == "hide") {
			toggleseconds("show");					
		}

		if (currmillisec <= 0) {
			examFinished = true;
			examTimedOut();			
		}

		displayRemainingTime();

		if (!examFinished) timers.push(setTimeout(updateRemainingTime, (1000 - diff)));
	}

	function displayRemainingTime() {
		currsec = currmillisec/1000;
		momentmillisec = moment.duration(currmillisec);
		hours = momentmillisec.hours();
		
		if (hours == 0) {
			$("#remain_hours").fadeOut();
		} else {
			$("#remain_hours").fadeIn();
		}
		
		minutes = momentmillisec.minutes();
		if (hours > 0 && minutes < 10) {
			minutes = "0" + minutes;
		}
		seconds = momentmillisec.seconds();
		seconds = seconds < 10? "0" + seconds: seconds;		

		$("#remain_hours").html(hours + "<span class='tiny'> h</span>");
		$("#remain_min").html(minutes + "<span class='tiny'> min</span>");
		$("#remain_sec").html(seconds + "<span class='tiny'> s</span>");
	}
	function toggleseconds (togglesec) {
		if (togglesec == "hide") {
			$("#remain_sec").fadeOut();
			seconds_toggle = "hide";					
		} else {
			$("#remain_sec").fadeIn();
			seconds_toggle = "show";					
		}
	}
	function examTimedOut() {
		if (readingflag==true) {
			$("#stage_title").text("Reading Time Finished / Exam Time:").css('color','yellow');
			$("#buttonStart").removeClass('disabled').text("Start Exam Time");
			initializeExamTimer(examtime,"exam");
		} else {
			$("#stage_title").text("Exam Time Finished");	
			$("#remainingTime").css("color","#555");			
			$("#buttonSetup").removeClass('disabled');			
			$("#buttonReset").addClass('disabled');
		}
		$("div.footer").fadeIn();
	}


});