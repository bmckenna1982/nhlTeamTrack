let $animationElements = $('.animation');
let $window = $(window);

function checkInView() {
    let windowHeight = $window.height();
    let windowTopPosition = $window.scrollTop();
    let windowBottomPosition = (windowTopPosition + windowHeight);

    $.each($animationElements, function() {
        let $element = $(this);
        let elementHeight = $element.outerHeight();
        let elementTopPosition = $element.offset().top;
        let elementBottomPosition = (elementTopPosition + elementHeight);

        if ((elementBottomPosition >= windowTopPosition) &&
            (elementTopPosition <= windowBottomPosition)) {
                $element.addClass('in-view');
            } else {
                $element.removeClass('in-view');
            }
    });
}

$window.on('scroll', checkInView );
$window.on('scroll resize', checkInView );
$window.trigger('scroll');