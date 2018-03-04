 (function(){
	'use strict';

	// Key codes
	var keys = {
		enter : 13,
		esc   : 27,
		left  : 37,
		right : 39
	};

	angular
	.module('thatisuday.ng-image-gallery', ['ngAnimate'])
	.provider('ngImageGalleryOpts', function(){
		var defOpts = {
			thumbnails  	:   true,
			thumbSize		: 	80,
			thumbLimit		: 	false,
			inline      	:   false,
			bubbles     	:   true,
			bubbleSize		: 	20,
			imgBubbles  	:   false,
			bgClose     	:   false,
			piracy 			: 	false,
			imgAnim         : 'fadeup',
			textValues: {
			    imageLoadErrorMsg       : 'Error when loading the image!',
			    deleteButtonTitle       : 'Delete this image...',
			    editButtonTitle         : 'Edit this image...',
			    closeButtonTitle        : 'Close',
			    externalLinkButtonTitle : 'Open image in new tab...'			    
			}			
		};

		return{
			setOpts : function(newOpts){
				angular.extend(defOpts, newOpts);
			},
			$get : function(){
				return defOpts;
			}
		}
	})
	.filter('ngImageGalleryTrust', ['$sce', function($sce) {
      return function(value, type) {
        // Defaults to treating trusted value as `html`
        return $sce.trustAs(type || 'html', value);
      }
    }])
    
	

	.directive('ngImageGallery', ['$rootScope', '$timeout', '$q', 'ngImageGalleryOpts',
	function($rootScope, $timeout, $q, ngImageGalleryOpts){
		return {
			replace : true,
			transclude : false,
			restrict : 'AE',
			scope : {
				images 			: 	'=',		// []
				methods 		: 	'=?',		// {}
				conf 			: 	'=?',		// {}

				thumbnails 		: 	'=?',		// true|false
				thumbSize		: 	'=?', 		// px
				thumbLimit		: 	'=?', 		// px
				inline 			: 	'=?',		// true|false
				bubbles 		: 	'=?',		// true|false
				bubbleSize 		: 	'=?',		// px
				imgBubbles 		: 	'=?',		// true|false
				bgClose 		: 	'=?',		// true|false
				piracy			: 	'=?',		// true|false
				imgAnim 		: 	'@?',		// {name}
				textValues      :   '=?',		// {}

				onOpen 			: 	'&?',		// function
				onClose 		: 	'&?',		// function,
				onDelete        :   '&?',
				onEdit          :   '&?'
			},
			template : 	'teszt',

			link : {
				pre : function(scope, elem, attr){

					/*
					 *	Operational functions
					**/

					// Show gallery loader
					scope._showLoader = function(){
						scope.imgLoading = true;
					}

					// Hide gallery loader
					scope._hideLoader = function(){
						scope.imgLoading = false;
					}

					// Image load complete promise
					scope._loadImg = function(imgObj){

						// Return rejected promise
						// if not image object received
						if(!imgObj) return $q.reject();

						var deferred =  $q.defer();

						// Show loader
						if(!imgObj.hasOwnProperty('cached')) scope._showLoader();

						// Process image
						var img = new Image();
						img.src = imgObj.url;
						img.onload = function(){
							// Hide loader
							if(!imgObj.hasOwnProperty('cached')) scope._hideLoader();

							// Cache image
							if(!imgObj.hasOwnProperty('cached')) imgObj.cached = true;

							deferred.resolve(imgObj);
						}
						img.onerror = function(){
							if(!imgObj.hasOwnProperty('cached')) scope._hideLoader();

							deferred.reject('Error when loading img');
						}

						return deferred.promise;
					}

					scope._setActiveImg = function(imgObj){
						// Get images move direction
						if(
							scope.images.indexOf(scope._activeImg) - scope.images.indexOf(imgObj) == (scope.images.length - 1) ||
							(
								scope.images.indexOf(scope._activeImg) - scope.images.indexOf(imgObj) <= 0 &&
								scope.images.indexOf(scope._activeImg) - scope.images.indexOf(imgObj) != -(scope.images.length - 1)
							)

						){
							scope._imgMoveDirection = 'forward';
						}
						else{
							scope._imgMoveDirection = 'backward';
						}

						// Load image
						scope._loadImg(imgObj).then(function(imgObj){
							scope._activeImg = imgObj;
							scope._activeImageIndex = scope.images.indexOf(imgObj);
							scope.imgError = false;
						}, function(){
							scope._activeImg = null;
							scope._activeImageIndex = scope.images.indexOf(imgObj);
							scope.imgError = true;
						})
						;
					}

					scope._safeApply = function(fn){
						var phase = this.$root.$$phase;
						if(phase == '$apply' || phase == '$digest'){
							if(fn && (typeof(fn) === 'function')){
								fn();
							}
						}else{
							this.$apply(fn);
						}
					};

					scope._deleteImg = function(img){
						var _deleteImgCallback = function(){
							var index = scope.images.indexOf(img);
							console.log(index);
							scope.images.splice(index, 1);
							scope._activeImageIndex = 0;

							/**/
						}

						scope.onDelete({img: img, cb: _deleteImgCallback});
					}

					scope._editImg = function (img) {
					    if (!scope.inline) scope.methods.close();

					    scope.onEdit({ img: img });
					}


					/***************************************************/


					/*
					 *	Gallery settings
					**/

					// Modify scope models
					scope.images 	 	 = 	(scope.images 		!= undefined) ? scope.images 	 : 	[];
					scope.methods 	 	 = 	(scope.methods 		!= undefined) ? scope.methods 	 : 	{};
					scope.conf 	 		 = 	(scope.conf 		!= undefined) ? scope.conf 		 : 	{};

					// setting options
					scope.$watchCollection('conf', function(conf){
						scope.thumbnails 	 = 	(conf.thumbnails 	!= undefined) ? conf.thumbnails 	: 	(scope.thumbnails 	!= undefined) 	?  scope.thumbnails		: 	ngImageGalleryOpts.thumbnails;
						scope.thumbSize 	 = 	(conf.thumbSize 	!= undefined) ? conf.thumbSize 		: 	(scope.thumbSize 	!= undefined) 	?  scope.thumbSize		: 	ngImageGalleryOpts.thumbSize;
						scope.thumbLimit 	 = 	(conf.thumbLimit 	!= undefined) ? conf.thumbLimit 		: 	(scope.thumbLimit	!= undefined) 	?  scope.thumbLimit		: 	ngImageGalleryOpts.thumbLimit;
						scope.inline 	 	 = 	(conf.inline 		!= undefined) ? conf.inline 	 	: 	(scope.inline 		!= undefined) 	?  scope.inline			: 	ngImageGalleryOpts.inline;
						scope.bubbles 	 	 = 	(conf.bubbles 		!= undefined) ? conf.bubbles 	 	: 	(scope.bubbles 		!= undefined) 	?  scope.bubbles		: 	ngImageGalleryOpts.bubbles;
						scope.bubbleSize 	 = 	(conf.bubbleSize 	!= undefined) ? conf.bubbleSize 	 : 	(scope.bubbleSize 	!= undefined) 	?  scope.bubbleSize		: 	ngImageGalleryOpts.bubbleSize;
						scope.imgBubbles 	 = 	(conf.imgBubbles 	!= undefined) ? conf.imgBubbles 	: 	(scope.imgBubbles 	!= undefined) 	?  scope.imgBubbles		: 	ngImageGalleryOpts.imgBubbles;
						scope.bgClose 	 	 = 	(conf.bgClose 		!= undefined) ? conf.bgClose 	 	: 	(scope.bgClose 		!= undefined) 	?  scope.bgClose		: 	ngImageGalleryOpts.bgClose;
						scope.piracy 	 	 = 	(conf.piracy 		!= undefined) ? conf.piracy 	 	: 	(scope.piracy 		!= undefined) 	?  scope.piracy			: 	ngImageGalleryOpts.piracy;
						scope.imgAnim 	 	 = 	(conf.imgAnim 		!= undefined) ? conf.imgAnim 	 	: 	(scope.imgAnim 		!= undefined) 	?  scope.imgAnim		: 	ngImageGalleryOpts.imgAnim;
                        scope.textValues     =  (conf.textValues    != undefined) ? conf.textValues     :   (scope.textValues   != undefined)   ?  scope.textValues     :   ngImageGalleryOpts.textValues;
					});

					scope.onOpen 	 = 	(scope.onOpen 	!= undefined) ? scope.onOpen 	 : 	angular.noop;
					scope.onClose 	 = 	(scope.onClose 	!= undefined) ? scope.onClose 	 : 	angular.noop;
					scope.onDelete = (scope.onDelete != undefined) ? scope.onDelete : angular.noop;
					scope.onEdit = (scope.onEdit != undefined) ? scope.onEdit : angular.noop;

					// If images populate dynamically, reset gallery
					var imagesFirstWatch = true;
					scope.$watchCollection('images', function(){
						if(imagesFirstWatch){
							imagesFirstWatch = false;
						}
						else if(scope.images.length){
							scope._setActiveImg(scope.images[scope._activeImageIndex || 0]);
						}
					});

					// Watch index of visible/active image
					// If index changes, make sure to load/change image
					var activeImageIndexFirstWatch = true;
					scope.$watch('_activeImageIndex', function(newImgIndex){
						if(activeImageIndexFirstWatch){
							activeImageIndexFirstWatch = false;
						}
						else if(scope.images.length){
							scope._setActiveImg(
								scope.images[newImgIndex]
							);
						}
					});

					// Open modal automatically if inline
					scope.$watch('inline', function(){
						$timeout(function(){
							if(scope.inline) scope.methods.open();
						});
					});


					/***************************************************/


					/*
					 *	Methods
					**/

					// Open gallery modal
					scope.methods.open = function(imgIndex){
						// Open modal from an index if one passed
						scope._activeImageIndex = (imgIndex) ? imgIndex : 0;

						scope.opened = true;

						// set overflow hidden to body
						if(!scope.inline) angular.element(document.body).addClass('body-overflow-hidden');

						// call open event after transition
						$timeout(function(){
							scope.onOpen();
						}, 300);
					}

					// Close gallery modal
					scope.methods.close = function(){
						scope.opened = false; // Model closed

						// set overflow hidden to body
						angular.element(document.body).removeClass('body-overflow-hidden');

						// call close event after transition
						$timeout(function(){
							scope.onClose();
							scope._activeImageIndex = 0; // Reset index
						}, 300);
					}

					// Change image to next
					scope.methods.next = function(){
						if(scope._activeImageIndex == (scope.images.length - 1)){
							scope._activeImageIndex = 0;
						}
						else{
							scope._activeImageIndex = scope._activeImageIndex + 1;
						}
					}

					// Change image to prev
					scope.methods.prev = function(){
						if(scope._activeImageIndex == 0){
							scope._activeImageIndex = scope.images.length - 1;
						}
						else{
							scope._activeImageIndex--;
						}
					}

					// Close gallery on background click
					scope.backgroundClose = function(e){
						if(!scope.bgClose || scope.inline) return;

						var noCloseClasses = [
							'galleria-image',
							'destroy-icons-container',
							'ext-url',
							'close',
							'next',
							'prev',
							'galleria-bubble'
						];

						// check if clicked element has a class that
						// belongs to `noCloseClasses`
						for(var i = 0; i < e.target.classList.length; i++){
							if(noCloseClasses.indexOf(e.target.classList[i]) != -1){
								break;
							}
							else{
								scope.methods.close();
							}
						}
					}


					/***************************************************/


					/*
					 *	User interactions
					**/

					// Key events
					angular.element(document).bind('keyup', function(event){
						// If inline modal, do not interact
						if(scope.inline) return;

						if(event.which == keys.right || event.which == keys.enter){
							$timeout(function(){
								scope.methods.next();
							});
						}
						else if(event.which == keys.left){
							$timeout(function(){
								scope.methods.prev();
							});
						}
						else if(event.which == keys.esc){
							$timeout(function(){
								scope.methods.close();
							});
						}
					});

					


					/***********************************************************/


					/*
					 *	Actions on angular events
					**/

					var removeClassFromDocumentBody = function(){
						angular.element(document.body).removeClass('body-overflow-hidden');
					};

					$rootScope.$on('$stateChangeSuccess', removeClassFromDocumentBody);
					$rootScope.$on('$routeChangeSuccess', removeClassFromDocumentBody);

				}
			}
		}
	}]);
 })();