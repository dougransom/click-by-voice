///
/// Labeling an element with a hint tag
///
/// Provides AddHint

let AddHint = null;

(function() {


    // place me <<<>>>
    function CSS_number(element, property_name) {
	const value = css(element, property_name, "none");
	//console.log(property_name + " -> " + value);
	if (value == "none")
	    return 0;
	if (/^[0-9]+px$/.test(value))
	    return parseFloat(value);
	if (value == "100%")
	    return element.parent().width(); // <<<>>>
	return 0;
    }


    //
    // Generic manipulations of DOM elements
    //

    // add CSS declaration '<item>: <value> !important' to element's
    // inline styles;
    // has no effect on XML elements, which ignore inline styles
    function set_important(element, item, value) {
	try {
	    // jquery .css(-,-)  does not handle !important correctly:
	    element[0].style.setProperty(item, value, "important");
	    //element[0].style.setProperty(item, value);
	} catch (e) {}  // XML elements throw an exception
    }


    // insert element before/after target or (if put_inside), at the
    // beginning of target's contents or at the end of target's contents
    function insert_element(target, element, put_before, put_inside) {
	if (put_inside) {
	    if (put_before)
		target.prepend(element);
	    else
		target.append(element);
	} else {
	    if (put_before)
		target.before(element);
	    else
		target.after(element);
	}    
    }



    //
    // Building hint tags
    //

    function build_base_element() {
	const element = $("<span></span>");
	// mark our inserted elements so we can distinguish them:
	element.attr("CBV_hint_element", "true"); 
	return element;
    }

    function add_text(element, text) {
	element.attr("CBV_add_text", "true");  // activate style rules
	if (Hints.option("c"))
	    element.attr("CBV_high_contrast", "true");
	element.append(text);
	return element;
    }

    function build_hint(element, hint_number, use_overlay) {
	const outer = build_base_element();
	outer.attr("CBV_hint_tag", hint_number);

	if (use_overlay) {
	    outer.attr("CBV_outer_overlay", "true");

	    const inner = build_base_element();
	    outer.append(inner);

	    inner.attr("CBV_inner_overlay", "true");
	    add_text(inner, hint_number);

	    // IMPORTANT: need to have top, left set so offset(-[,-])
	    //            works correctly on this element:
	    set_important(inner, "top",  "0");
	    set_important(inner, "left", "0");

	    // beat hinted element's z-index by at least one;
	    // if we are not in a different stacking context, this should
	    // put us on top of it.
	    let zindex = css(element, "z-index", 0);
	    if (Hints.option("zindex")) {
		const min_zindex = Hints.option_value("zindex");
		if (zindex < min_zindex || zindex == "auto")
		    zindex = min_zindex;
	    }
	    if (zindex > 0)
		set_important(inner, "z-index", zindex+1);

	} else {
	    outer.attr("CBV_outer_inline", "true");
	    add_text(outer, hint_number);
	}

	return outer;
    }



    //
    // Analysis routines
    //

    // Can we legally put a span element inside of element and have it be
    // visible?  Does not take CSS properties into account.
    function can_put_span_inside(element) {
	// unconditionally _empty elements_ that cannot have any child
	// nodes (text or nested elements):
	if (element.is("area, base, br, col, command, embed, hr, img, input, keygen, link, meta, param, source, track, wbr")) 
	    return false;

	if (element.is("select, option, textarea")) 
	    return false;

	if (element.is("iframe")) 
	    // iframe contents are displayed only if browser doesn't support iframe's
	    return false;

	// only actual webpage elements are fair game:
	if (CBV_inserted_element(element))
	    return false;

	if (element.is("div, span, a, button, li, th, td")) 
	    return true;

	// above absolutely correct; below is heuristic:
	try {
	    if (element.contents().length > 0)
		return true;
	} catch (e) {}
	return false;
    }


    // is it okay to put a span before this element?
    function span_before_okay(element) {
	// don't put spans before tr elements (else messes up table
	// formatting as treats span as first column):
	if (element.is("tr")) 
	    return false;

	return true;
    }



    //
    // Adding overlay hints
    //

    function compute_displacement(element) {
	const displacement = parseInt(Hints.option_value('E', '0'));
	const displacement_right = parseInt(Hints.option_value('displaceX', displacement));
	const displacement_up    = parseInt(Hints.option_value('displaceY', displacement));
	let extra_displacement_right = 0;
	if (Hints.option("?") && element.is("input")) {
	    const padding = CSS_number(element,"padding-right");
	    // too large padding mean something's probably being
	    // positioned there absolutely so don't put overlay there
	    if (padding > 10)
		extra_displacement_right = -padding + 5;
	}

	let use_displacement = false;
	if (element.is('a, code, b, i, strong, em, abbr, input[type="checkbox"], input[type="radio"]') && element.children().length == 0) {
	    use_displacement = true;
	}
	if (Hints.option('f')) {
	    use_displacement = true;
	}
	if (Hints.option('alwaysDisplace')) {
	    use_displacement = true;
	}

	if (use_displacement) {
	    return {up: displacement_up, right: displacement_right+extra_displacement_right};
	} else {
	    return {up: 0, right: extra_displacement_right};
	}
    }


    function add_overlay_hint(element, hint_number) {
	const hint_tag    = build_hint(element, hint_number, true);
	const inner	= hint_tag.children().first();
	let show_at_end = !Hints.option("s");

	// hard coding reddit entire story link: <<<>>>
	if (/\.reddit\.com/.test(window.location.href)) {
	    if (element.is(".thing"))
		show_at_end = false;
	}

	// needs to be before we insert the hint tag <<<>>>
	const displacement = compute_displacement(element);

	let container = element;
	if (Hints.option("exclude")) {
	    while (container.is(Hints.option_value("exclude"))) {
		container = container.parent();
	    }
	}

	if (Hints.option("f")) {
	    $("body").after(hint_tag);

	} else if (container.is("table, tr, td, th, colgroup, tbody, thead, tfoot")) {
	    // temporary kludge for Gmail: <<<>>>
	    while (container.is("table, tr, td, th, colgroup, tbody, thead, tfoot"))
		container = container.parent();
	    insert_element(container, hint_tag, true, false);

	} else {
	    //
	    // We prefer to put overlays inside the element so they share the
	    // element's fate.  If we cannot legally do that, we prefer before
	    // the element because after the element has caused the inserted
	    // span to wrap to the next line box, adding space.
	    //
	    if (can_put_span_inside(container))
		insert_element(container, hint_tag, true, true);
	    else 
		insert_element(container, hint_tag, span_before_okay(container), false);
	}


	// move overlay into place at end after all inline hints have been
	// inserted so their insertion doesn't mess up the overlay's position:
	return (function (self) {
	    if (!element[0].isConnected) {
		return [null, () => {
		    // console.log(`disconnecting: ${hint_number}:`);
		    // console.log(element[0]);
		    $(`[CBV_hint_tag='${hint_number}']`).remove();
		    $(`[CBV_hint_number='${hint_number}']`).removeAttr("CBV_hint_number");
		}];
	    }
	    if (!inner[0].isConnected) {
		if (Hints.option("keep_hints")) {
		    // some webpages seem to temporarily disconnect then reconnect hints
		    return [self, null];
		}
		return [null, () => {
		    console.log(`lost hint for ${hint_number}; removing...`);
		    // TODO: automatically reconnect at bottom of body? <<<>>>
		    // do we need to preserve outer as well then?
		    $(`[CBV_hint_tag='${hint_number}']`).remove();
		    $(`[CBV_hint_number='${hint_number}']`).removeAttr("CBV_hint_number");
		}];
	    }
	    try { 
		// this fails for XML files...
		let target_offset = element.offset();
		const inner_offset = inner.offset();
		const element_hidden = (target_offset.top == 0 && target_offset.left == 0);
		const inner_hidden = (inner_offset.top == 0 && inner_offset.left == 0);
		if (show_at_end) {
		    target_offset.left += element.outerWidth() 
    		        - inner.outerWidth();
		}
		target_offset.top  -= displacement.up;
		target_offset.left += displacement.right;

		if (element_hidden) {
		    if (inner_hidden) {
			return [self, null];
		    }
		    return [self, () => {
			// console.log(`hiding hint for hidden element ${hint_number}`);
			inner.attr("CBV_hidden", "true"); 
		    }];
		}
		if (inner_hidden) {
		    // TODO: what if hidden attribute already removed?
		    return [self, () => {
			// console.log(`unhiding hint for unhidden element ${hint_number}`);
			inner.removeAttr("CBV_hidden"); 
			inner.offset(target_offset);
		    }];
		}

		if (Math.abs(inner_offset.left - target_offset.left) > 0.5 ||
		    Math.abs(inner_offset.top - target_offset.top) > 0.5) {
		    return [self, () => {
			// console.log(`repositioning overlay for ${hint_number}`);
			// console.log(`  ${inner_offset.top} x ${inner_offset.left}` + 
			// 	    ` -> ${target_offset.top} x ${target_offset.left}`);
			inner.offset(target_offset);
		    }];
		}
		return [self, null];
	    } catch (e) {}
	    // } catch (e) { console.log("exception:'s " + e); }
	    return [null, null];
	});
    }



    //
    // 
    //


    function visual_contents(element) {
	if (element.is("iframe"))
	    return [];
	
	const indent = css(element, "text-indent");
	if (indent && /^-999/.test(indent))
	    return [];
	const font_size = css(element, "font-size");
	if (font_size && /^0[^0-9]/.test(font_size))
            return [];

	return element.contents().filter(function () {
	    if (this.nodeType === Node.COMMENT_NODE)
		return false;

	    // ignore nodes intended solely for screen readers and the like
	    if (this.nodeType === Node.ELEMENT_NODE) {
		if (css($(this),"display") == "none")
		    return false;
		if (css($(this),"visibility") == "hidden")
		    return false;
		//	    if ($(this).width()==0 && $(this).height()==0)
		if (css($(this),"position")=="absolute"
		    || css($(this),"position")=="fixed")
		    return false;
	    }

	    return true;
	});
    }


    function get_text_overflow_ellipisis_clip(element) {
	for (;;) {
	    if (css(element, "text-overflow", "clip") != "clip") {
		let clip = {right: element[0].getBoundingClientRect().right};

		clip.right  -= CSS_number(element,"border-right-width") - 
		    CSS_number(element,"padding-right");
		const slop = CSS_number(element,"max-width") - element.width();
		if (slop>0)
		    clip.right += slop;

		if (slop>0)
		    clip.top = -slop;
		// if (slop>0)
		// 	console.log(clip);
		// console.log(element[0]);
		// console.log(element.css("max-width"));
		// console.log(slop);

		return clip;
	    }
	    if (css(element, "display") != "inline")
		return null;
	    element = element.parent();
	}
    }


    function ellipsis_clipping_possible(element) {
	const clip = get_text_overflow_ellipisis_clip(element);
	if (!clip)
	    return false;

	// hardwire 40 pixels as the maximum hint tag length for now: <<<>>>
	if (element[0].getBoundingClientRect().right + 40 < clip.right)
	    return false;

	return true;
    }


    //
    // Adding inline hints
    //

    // returns false iff unable to safely add hint
    function add_inline_hint_inside(element, hint_number) {
	if (Hints.option("exclude") && element.is(Hints.option_value("exclude"))) {
	    return false;
	}

	let current = element;
	for (;;) {
	    if (!can_put_span_inside(current))
		return false;

	    const inside = visual_contents(current);
	    if (inside.length == 0)
		return false;
	    const last_inside = inside.last();

	    if (last_inside[0].nodeType == Node.ELEMENT_NODE
		&& last_inside.is("div, span, i, b, strong, em, code, font, abbr")) {
		current = last_inside;
		continue;
	    }

	    if (last_inside[0].nodeType != Node.TEXT_NODE)
		return false;
	    if (last_inside.text() == " ")  // &nsbp
		// Google docs uses &nsbp; to take up space for visual items
		return false;
	    if (css(current, "display") == "flex")
		return false;

	    let put_before = false;
	    if (!Hints.option(".") && ellipsis_clipping_possible(current)) {
		if (!Hints.option(">"))
		    put_before = true;
		else
		    return false;
	    }

	    //const hint_tag = build_hint(element, hint_number, false);
	    const hint_tag = build_hint(current, hint_number, false);
	    insert_element(current, hint_tag, put_before, true);
	    return true;
	}
    }


    // this is often unsafe; prefer add_inline_hint_inside
    function add_inline_hint_outside(element, hint_number) {
	const hint_tag = build_hint(element, hint_number, false);
	insert_element(element, hint_tag, false, false);
    }



    function add_hint(element, hint_number) {
	if (Hints.option("#")) {
	    if (element.is("a") || element.is("button")) {
		const hint_tag = build_hint(element, hint_number, false);
		insert_element(element, hint_tag, false, true);
		return null;
	    }
	    add_inline_hint_outside(element, hint_number);
	    return null;
	}


	if (Hints.option("o"))
	    return add_overlay_hint(element, hint_number);

	if (Hints.option("i")) {
	    if (!add_inline_hint_inside(element, hint_number))
		add_inline_hint_outside(element, hint_number);
	    return null;
	}

	if (Hints.option("h")) {
	    if (!add_inline_hint_inside(element, hint_number)) {
		// if (element.is("input[type=checkbox], input[type=radio]")) {
		//     add_inline_hint_outside(element, hint_number);
		//     return null;
		// }
		return add_overlay_hint(element, hint_number);
	    }
	    return null;
	}

	// current fallback is inline
	if (!add_inline_hint_inside(element, hint_number))
	    add_inline_hint_outside(element, hint_number);
	return null;
    }


    AddHint = {add_hint: add_hint};
})();
