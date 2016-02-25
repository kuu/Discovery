(function() {
	function Player(OO_Provider) {
		var self = this;
		self.player;
		self.defaultVideo;
		self.videoName;
		self._promiseDeviceId =  Q.defer();
		self.deviceId = this._promiseDeviceId.promise;
		self.log =  new Log();
		self.OO_Provider = OO_Provider || OO;

		self.OO_Provider.getGuid(function(user_id) {
			console.log("OO_ID: " + user_id);
			self._promiseDeviceId.resolve(user_id);
			console.log("deviceId: "+ self.deviceId);
		});
	}


	Player.prototype.create = function(embedCodeVideo, autoplay) {
		var self = this;
		self.OO_Provider.ready(function() {
          	self.player = self.OO_Provider.Player.create(
            	'ooyala_player',
            	embedCodeVideo,
            	{
              		// add the embedded player parameters here
              		autoplay: autoplay,
              		width : "100%",
      		        height : "100%",
        		}
          	);
        });

	};

	Player.prototype.sendFeedback = function(event,bucket_info,feedbackEvent,logTitle) {
		var self = this;
		feedbackEvent = feedbackEvent || Math.floor(Math.random()*10e5);
		this.deviceId.then(function (deviceId) {
			$.ajax('/feedback/'+event, {
    			data : JSON.stringify({device_id:deviceId,bucket_info:bucket_info}),
    			contentType : 'application/json',
    			type : 'POST',
    			success: function() {
    				self.log.add('Sent feedback on event: '+ logTitle , feedbackEvent);
    			}
    		});
		});
	}

	Player.prototype.destroy = function() {
		if(this.player)
			this.player.destroy();
	}

	function onError(error) {
		console.log(error);
	}

	function Request() {
		this.request = new XMLHttpRequest();
		this.data;
	}

	function Carousel() {}

	var player = new Player();
	var promotedPlayer = new Player(promoted_namespace);
	var carousel = new Carousel();
	

	var app = new (function Application() {
		var self = this;
		
		self.sections = {};
		
		//Promoted
		var promoted = {};
		self.sections.promoted  = promoted;
		promoted.update = function() {
			var request = new Request();
			request.get('/promoted?limit=15&embedCode='+currentPlayer.player.embedCode,'Promoted');
		}
	})();

	Request.prototype.get = function(params, title) {
		$('#'+title.toLowerCase()).find('.Carousel-loading').fadeIn('slow', function() {});
		$('#'+title.toLowerCase()+' .Discovery-info').css('opacity','.5');
		$('#'+title.toLowerCase()+' .Carousel').css('opacity','.5');
		var self = this;
		this.request.open('GET', params, true);
		this.request.onload = function() {
			var carouselElem = $('.Carousel-'+title.toLowerCase());
			carouselElem.empty();
			if (self.request.status >= 200 && self.request.status < 400) {
		     		data = JSON.parse(self.request.responseText);
		     		var html = carousel.fill(data.results ? data.results : data.items, title);
		     		carouselElem.html(html);
		     		$('#'+title.toLowerCase()).find('.Carousel-loading').fadeOut('slow', function() {});
		     		$('#'+title.toLowerCase()+' .Discovery-info').css('opacity','1');
		     		$('#'+title.toLowerCase()+' .Carousel').css('opacity','1');
		     		if(carouselElem.hasClass('slick-initialized')) {
		     			//carouselElem.slick('unslick');
		     			carouselElem.removeClass('slick-slider')
		     			carouselElem.removeClass('slick-initialized')
		     		}
				carousel.init(carouselElem);
		     		if(!player.defaultVideo && data.results) {
		     			player.defaultVideo = data.results[0].embed_code;
		     			player.videoName = data.results[0].name;
					player.create(player.defaultVideo, false);
					carousel.updateSimilar(player.defaultVideo);
					app.sections.promoted.update();
		     		}
		  	} else {
		    		// We reached our target server, but it returned an error
			}
		};
		this.request.onerror = onerror;
		this.request.send();
	}

	Carousel.prototype.init = function(element) {
		var self = this;



		element.slick({
		  infinite: true,
		  autoplay: false,
		  centerMode: false,
		  speed: 300,
		  slidesToShow: 6,
		  slidesToScroll: 1,
		  arrows: true,
		  responsive: [{
		      breakpoint: 1780,
		      settings: {
		        slidesToShow: 5,
		      }
		    },{
		      breakpoint: 1500,
		      settings: {
		        slidesToShow: 4,
		      }
		    },{
		      breakpoint: 1220,
		      settings: {
		        slidesToShow: 3,
		      }
		    },{
		      breakpoint: 992,
		      settings: {
		        slidesToShow: 2,
		      }
		    },{
		      breakpoint: 769,
		      settings: {
		      	centerMode: true,
		        slidesToShow: 1,
		      }
		    },{
		      breakpoint: 550,
		      settings: {
		      	centerMode: true,
		        slidesToShow: 1,
		      }
		    }]
		});
	}

	Carousel.prototype.fill = function(videos, title) {
		if(videos) {
			var elements = '';
			var feedbackEvent = Math.floor(Math.random()*10e5);
			$.each(videos, function(index, val) {
				var bucket_info = val.bucket_info ? encodeURIComponent(val.bucket_info) : undefined;
				 elements += '<div class="Carousel-item" animated fadeIn data-title="'+title+'"data-name="'+val.name+'" data-embed="'+val.embed_code+'" data-bucket_info="'+bucket_info+'">\
								<div class="Carousel-video"><img src="'+val.preview_image_url+'" alt="" /></div>\
							</div>';
				if(bucket_info) {
					player.sendFeedback('impression',bucket_info,feedbackEvent,title +' impression');
				};
			});

			return elements;
		}
		return false;
	}

	Carousel.prototype.updateSimilar = function(embedCode) {
		var similar = new Request();
		similar.get('/similar/'+embedCode+'?limit=15', 'Similar');
	}

	Carousel.prototype.updatePopular = function(filter) {
		var popular = new Request();
		popular.get('/popular?window='+filter+'&limit=15', 'Popular');
	}

	Carousel.prototype.updateTrending = function(filter) {
		var trending = new Request();
		trending.get('/trending?window='+filter+'&limit=15', 'Trending');
	}

	function Log() {}

	Log.prototype.add = function(log, feedbackEvent) {
		var logEntry = $('#log_'+feedbackEvent);
		if(logEntry.size()>0) {
			var counter = Number.parseInt(logEntry.data('counter'));
			counter++;
			logEntry.data('counter',counter);
			logEntry.find(".counterTag").text(counter);
		}else{
			$('.Log ul').append('<li data-counter=1 id="log_'+feedbackEvent+'"><p>'+log+' <span class="counterTag">1</span></p></li>');
		}
		$(".Log-scroll")[0].scrollTop = $(".Log-scroll")[0].scrollHeight;
	}

	$(document).ready(function() {
		var trending = new Request();
		var popular = new Request();
		var recent = new Request();
		var promoted = new Request();
		currentPlayer = player;
		trending.get('/trending?window=week&limit=15', 'Trending');
		popular.get('/popular?window=week&limit=15', 'Popular');
		recent.get('/recent?limit=15', 'Recent');
		//promoted.get('/promoted/1?limit=15&embedCode=', 'Promoted');


		$('body').on('click','.Carousel-item', function() {
			if(currentPlayer) {
				currentPlayer.destroy();	
			} 
			var embed = $(this).data('embed');
			switch($(this).data('title')) {
				case 'Promoted':
					currentPlayer = promotedPlayer;
					break;
				default:
					currentPlayer = player;
					break;
			}
			currentPlayer.videoName = $(this).data('name');			
			currentPlayer.create(embed, true);
			carousel.updateSimilar(embed);
			app.sections.promoted.update();

			currentPlayer.sendFeedback('play',$(this).data('bucket_info'),undefined,'Play');

			$('body').animate({
				scrollTop: 0,
			},500, function() {});
		})

		$('body').on('click','.Discovery-toggle', function() {
			var description = $(this).parents('.Discovery-carousel').find('.Discovery-description');
			if(description.hasClass('open')) { 
				description.removeClass('open')
				$(this).html('Show more...');
			}else{
				description.addClass('open');
				$(this).html('Show less...')
			} 
				
 		});

 		$('body').on('click', '.Filter-option', function(event) {
 			event.preventDefault();
 			var category = $(this).data('category');
 			$('.Filter-option[data-category="'+category+'"]').removeClass('active');
 			$(this).addClass('active');
 			if(category === 'popular') {
 				carousel.updatePopular($(this).data('filter'));
 			}else if(category === 'trending') {
 				carousel.updateTrending($(this).data('filter'));
 			} 
 		});

 		$('body').on('click','a', function() {
 			if($(this).attr('href')) {
 				$('html, body').animate({
 				    scrollTop: $( $.attr(this, 'href') ).offset().top
 				}, 500);
 		    	return false;
 			}
 		});

 		$('body').on('click','.Log-toggle', function() {
 			if($(this).hasClass('isclose')) {
 				$(this).removeClass('isclose');
 				$(this).addClass('isopen');
 				$('.Log').addClass('isopen');
 			}else{
 				$(this).removeClass('isopen');
 				$(this).addClass('isclose');
 				$('.Log').removeClass('isopen');
 			}
 		})

	});
})();
