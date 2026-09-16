> "The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect." – Tim Berners-Lee

## Motivation

According to [Datareportal](https://datareportal.com/global-digital-overview), there are 4.72 billion users that use the internet, which is around 60% of the world population. Among those users, many of them have some sort of disability. To say it with numbers, approximately 15% of the world population live with disabilities which translates to about **702 million internet users**. Because of this, it is mandatory that each web app is adequately created and follows accessibility guidelines so all users can use it.

Accessibility in web applications, or web accessibility for short, is a practice used by web developers to make their applications accessible to all users, regardless of disability. Today, this practice makes an application stand out and increases the search engine optimization (SEO) rating.

## Introduction

Accessibility is a practice that ensures that people with disabilities can do what they need to do in a similar amount of time and effort as someone that does not have a disability. In terms of web accessibility, each user should perceive, navigate, use, interact and contribute to the web application the same as someone who does not have a disability.

Web accessibility encompass all disabilities that affect access to web applications: auditory, cognitive, neurological, physical, speech, and visual. Also, accessible web applications benefit users without disabilities:

- users that are using mobile phones, smartwatches, TVs, different input modes, etc.
- older people with changing abilities
- users with "temporary disabilities" such as a broken arm, ear infection, etc.
- users with "situational limitations" such as bright sunlight, noisy environment
- users with slow internet connection

The web is an increasingly important resource in all aspects of life, especially today when there is a global pandemic. Everything is transferring to an "online world" from government, education, health care, shopping, etc. Because of this migration, everyone must have equal access whether they have a disability or not. Further, this is a fundamental human right in the [United Nations Convention on the Rights of Persons with Disabilities](https://www.un.org/development/desa/disabilities/convention-on-the-rights-of-persons-with-disabilities.html). On many occasions, and this is becoming a trend now, web accessibility is required by law.

## Accessibility tree

An accessibility tree is a data structure that contains data from the web application. Every page has an accessibility tree, and this is generated automatically by the browser. If a user uses an assistive technology, then the assistive technology will use this tree to present data to a user in a way they can perceive it. The two of them communicate over an API.

For an accessibility tree to be an excellent representation of an application, the developer should be careful to express the page's semantics correctly. The developer makes sure that the crucial elements on the page have the correct accessible roles, states, and properties and that all elements specify accessible names and descriptions. To make your life easier, there are a lot of semantic elements already built into the browser, and we can rely on them. E.g., use buttons instead of div and span elements, use proper input type, make sure there are labels and/or text alternatives, etc.

![Google Chrome Accessibility Tree](/img/accessibility_tree.png)

## Assistive technologies

Assistive technology is any item, piece of equipment, software or product system that is used to improve functional capabilities of a person with disabilities. Some examples of assistive technology are special-purpose computers, prosthetics, special switches, special keyboards, wheelchairs, etc. However, there is also a wide variety of assistive technology used on the web.

Assistive technologies scan the page from the top to the bottom. E.g., we have a search box where the search (submit) button is placed before an input in the Document Object Model (DOM). As a result, a button will be accessed before the input in the accessibility tree, which might be a bad user experience, so developers and designers should watch out for such situations.

### Screen readers

Screen readers are software used by blind or visually impaired people. This software processes the content on the desktop and in the web browser and converts it to other forms of data that user can use. Often content is converted to speech so users can listen to that, but there are also variants when content is converted to Braille. Typically, screen readers provide other functions such as shortcut keys, different modes for processing and interacting with content. Some examples of screen readers are Apple VoiceOver and Window Eyes.

#### Apple's Voice Over

Every Apple device is equipped with a service called VoiceOver Utility. This service is a software that helps users perceive, use and navigate the content shown on the screen. By default it is not enabled so to enable it press <kbd>Command</kbd> + <kbd>F5</kbd> on your keyboard or follow these steps:

1. Go to System Preferences
2. From the menu, select Accessibility
3. Select VoiceOver
4. Check Enable VoiceOver.

To do things with the VoiceOver, it is necessary to learn the VO key. VO stands for VoiceOver and the key is a combination of <kbd>Control</kbd> and <kbd>Option</kbd> keys on a keyboard. Now, once this is known, it is possible to do the following

- Help: VO key + <kbd>H</kbd>
- Navigation (next/previous): VO key + <kbd>Left/Right arrow</kbd>
- Navigation by heading: VO key + <kbd>Command</kbd> + <kbd>H</kbd>
- Etc.

## Semantics in HT&zwnj;ML

By definition semantics in programming refers to the meaning of a piece of code, e.g., _"What effect does running that line of JavaScript have?"_, or _"What purpose or role does that HTML element have?"_ (rather than _"What does it look like?"_).

In the HTML world semantics refers to the self-explanatory HTML elements. These elements give you context and purpose simply by looking at the code without seeing the page. Elements like: `aside`, `header`, `main`, `button`, `nav`, `section`, etc. are semantic HTML elements. The whole list of semantic elements can be found in [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

Semantic elements are good to use since they are:

- **Easier to work with** — you most of the time get some functionality built in plus it is easier to understand the page without looking at the final product
- **Better on slow networks** — semantic HTML elements are smaller in file size than non-semantic (generic) elements. E.g., button element will give you default styles, built-in keyboard event listeners, semantic value, will be focusable, etc.; on the other hand, to make the same component using a div element everything mentioned would mean that more code is required to write which will result in a bigger bundle size.
- **SEO benefits** — search engines give more importance to keywords inside semantic elements like headings, links, etc. than keywords included in non-semantic divs, etc., so your documents will be more findable by searchers.

## ARIA

ARIA stands for Accessible Rich Internet Application. ARIA is a set of attributes that define ways to make content and web applications more accessible to people with disabilities. Using ARIA attributes, any component should be accessible so assistive technologies can read the data. Today, there are many widgets and components that are ready out of the box and require little to no extra work to make them accessible. If there is no HTML element that would match our case, ARIA attributes take care to make that component accessible. To learn how to use ARIA there is great documentation from The World Wide Web Consortium (W3C) on ARIA attributes as well as ARIA guidelines on how to use it in a real case.

- [Introduction and description of all ARIA properties](https://www.w3.org/TR/wai-aria/)
- [ARIA design patterns](https://www.w3.org/TR/wai-aria-practices/)
- [Accessibility guidelines](https://www.w3.org/TR/WCAG21/)

### ARIA roles

An ARIA role is the main indicator of a type. This semantic association allows assistive technologies to present and support interaction with the element. It is set on an element using a role attribute and must not be changed over time or with an interaction. If there is a reason to do this, the developer should remove the old element and create a new one with a new role.

The role taxonomy uses the following relationships to relate different roles in relation to each other: a superclass role, subclass roles, related concepts and a base concept. Superclass role is the role that the current role extends in the taxonomy. Subclass roles is the list of roles to which this role is the superclass. Related concepts are informative data about similar concepts from other specifications and those concepts are not necessarily identical. E.g., progressbar and status roles are related concepts. Base concept is information about objects that are considered prototypes for this role, e.g., HTML element checkbox is a base concept of a checkbox role.

ARIA roles are categorized into six categories:

- Abstract roles are used to support role taxonomy for the purpose of defining general roles. These roles are used for the ontology and should not be used in the content.
- Widget roles describe common interactive patterns for elements that can be used as a standalone user interface or as a part of a larger, composite widget or as a composite widget. Some roles from this category already have a proper semantic HTML element and it is recommended to use those instead of using ARIA roles, e.g., `button`, `checkbox`, `link`.
- Document structure roles provide a structural description for a section and these roles are often non-interactive. Some document roles, e.g., `form`, map onto existing HTML tags and are only meant for cases when using the native tag is not possible.
- Landmark roles identify large content areas and are used by assistive technology for navigation. All content of a page should be placed inside an element with a landmark role. As a result, all content could be navigated to by use of landmarks. For some roles in this category, there are HTML elements with the same name, e.g., `<main>` and `role="main"`.
- Live region is a part of an application where some data is updated because of some event, e.g., toast notifications and chat log. Since the user's focus might be elsewhere on a page when the data in this region updates, ARIA has provided a collection of ARIA properties that are used with this role: `aria-live`, `aria-relevant`, `aria-atomic`, and `aria-busy`. With these properties developers can tell assistive technologies when to move focus on to this region. Live region role is a role that indicates a live region.
- Window roles help in creating a window within the application. The two roles that inherit a window role are `dialog` and `alertdialog`.

### ARIA attributes

Term _ARIA attributes_ is a synonym for _ARIA states and ARIA properties_. This synonym is used because ARIA states and ARIA properties have similar definitions and are often hard to tell apart.

ARIA state is a dynamic property that expresses characteristics of an element that may change due to user interaction. ARIA states do not affect the essential nature of the element, but they give further information about the element.

ARIA property is an element’s attribute that is crucial to the nature of the element. A change of a property may remarkably affect the presentation of an element.

As described, both ARIA states and ARIA properties provide some information about an element, and both are part of the definition of an element’s role. In terms of web accessibility, they both have the same markup: the name of an ARIA attribute is prefixed by `aria-`, e.g., `aria-current`. Even though they are similar, they are maintained conceptually distinct to clarify minor differences between them. One major difference is that the values of ARIA properties are usually unchanged throughout the life cycle of an application than the values of ARIA states which are expected to change due to user interactions.

ARIA attributes are categorized into four categories:

- Widget attributes are attributes used for common user interface elements that receive and process user actions. Such attributes help assistive technology to better represent the state of a user interface element to a user, e.g., `aria-required="true"` will tell the user that this field is required before submitting a form.
- Live region attributes are a set of four ARIA attributes: `aria-atomic`, `aria-busy`, `aria-live`, and `aria-relevant`. These attributes are specific to live regions and may be applied to any element. The purpose of these attributes is to indicate that content may change without the element having focus. E.g., `aria-live="off"` won’t change user’s focus if content changes, `aria-live="polite"` will change user’s focus when content changes with the flow of the content and `aria-live="assertive"` will change user’s flow of content immediately when content changes.
- Drag-and-drop attributes are used to indicate information about drag-and-drop elements and to mark draggable elements and their drop targets. There are only two attributes: `aria-dropeffect` and `aria-grabbed`.
- Relationship attributes are attributes that will indicate a relation between elements that cannot be determined from a document structure. To create relationships between elements, element’s id property is used. E.g., `aria-errormessage` identifies an element that contains an error message for a given element.

### Rules of using ARIA

W3C has created a document [Using ARIA](https://www.w3.org/TR/using-aria/) that covers five rules and gives some more answers to frequently asked questions about using ARIA in web applications. These rules and answers demonstrate how to use ARIA and it helps with dynamic content and complex user interactions developed with JavaScript.

First rule says that if the developer can use a native HTML element that implements wanted behavior and semantics, the developer should use it instead of using a generic element with ARIA role, states, and properties.

Second rule says the native semantics should not be overridden. E.g., if there is a need to create a tab that is also a heading instead of doing this

```html
<h2 role="tab">Tab Heading</h2>
```

the developer should do

```html
<div role="tab">
	<h2>Tab Heading</h2>
</div>
```

Third rule says that all interactive components that can receive user input such as mouse click or mouse drag, must be scripted in a way that all interactions are possible with keyboard only. E.g., click on a button can be emulated by pressing the <kbd>Enter</kbd> or <kbd>Space</kbd> key on a keyboard.

Fourth rule says that `role="presentation"` and/or `aria-hidden="true"` should not be used on a focusable element or any element that contains a focusable element as a child. If a focusable element is not visible on a page, then the `aria-hidden="true"` property must be set, but the developer must ensure the element is not focusable by using `tabindex="-1"`. If an element is hidden using `display: none` or `visibility: hidden`, the browser will make this implicit for the developer.

Fifth rule says that all interactive elements must have an accessible name. An element has an accessible name only if the Accessibility API has a name value. E.g., an input can have a text next to it and to a user without disabilities can see the label, but users using assistive technology won’t be able to see that. But if an accessible name is set, each user will see the element’s label. There are multiple ways to label an element:

- using a `<label>` element
- using an `aria-label` ARIA property
- using an `aria-labelled` ARIA property.

## Examples

In following section, you can find links to ARIA practices for many components. Each component has multiple sections:

- descriptions
- examples
- keyboard support
- ARIA roles/states/properties and tabindex attributes
- Source code HTML and JS (CSS sometimes)

Here is the list of components:

- [Accordion](https://www.w3.org/TR/wai-aria-practices-1.1/#accordion)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/accordion/accordion.html)
- [Alert](https://www.w3.org/TR/wai-aria-practices-1.1/#alert)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/alert/alert.html)
- [Alert and message dialogs](https://www.w3.org/TR/wai-aria-practices-1.1/#alertdialog)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/dialog-modal/alertdialog.html)
- [Breadcrumb](https://www.w3.org/TR/wai-aria-practices-1.1/#breadcrumb)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/breadcrumb/index.html)
- [Button](https://www.w3.org/TR/wai-aria-practices-1.1/#button)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/button/button.html)
- [Carousel](https://www.w3.org/TR/wai-aria-practices-1.1/#carousel)
  - [Auto-rotating image carousel example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/carousel/carousel-1.html)
- [Checkbox](https://www.w3.org/TR/wai-aria-practices-1.1/#checkbox)
  - [2 state checkbox example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/checkbox/checkbox-1/checkbox-1.html)
  - [3 state checkbox example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/checkbox/checkbox-2/checkbox-2.html)
- [Combo Box](https://www.w3.org/TR/wai-aria-practices-1.1/#combobox)
  - [Combo box with list popup example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.1pattern/listbox-combo.html)
  - [Combo box with grid popup example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.1pattern/grid-combo.html)
  - [Combo box with inline autocomplete example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.0pattern/combobox-autocomplete-both.html)
  - [Combo box with list autocomplete example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.0pattern/combobox-autocomplete-list.html)
  - [Combo box with without autocomplete example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/combobox/aria1.0pattern/combobox-autocomplete-none.html)
- [Dialog Modal](https://www.w3.org/TR/wai-aria-practices-1.1/#dialog_modal)
  - [Modal example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/dialog-modal/dialog.html)
  - [Datepicker dialog example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/dialog-modal/datepicker-dialog.html)
- [Disclosure](https://www.w3.org/TR/wai-aria-practices-1.1/#disclosure)
  - [Long image description example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/disclosure/disclosure-img-long-description.html)
  - [F.A.Q. example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/disclosure/disclosure-faq.html)
  - [Navigation example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/disclosure/disclosure-navigation.html)
- [Feed](https://www.w3.org/TR/wai-aria-practices-1.1/#feed)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/feed/feed.html)
- [Grid](https://www.w3.org/TR/wai-aria-practices-1.1/#grid)
  - [Layout example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/grid/LayoutGrids.html)
  - [Data example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/grid/dataGrids.html)
  - [Advanced data example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/grid/advancedDataGrid.html)
- [Link](https://www.w3.org/TR/wai-aria-practices-1.1/#Link)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/link/link.html)
- [Listbox](https://www.w3.org/TR/wai-aria-practices-1.1/#Listbox)
  - [Scrollable listbox example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/listbox/listbox-scrollable.html)
  - [Collapsible listbox example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/listbox/listbox-collapsible.html)
  - [Rearrangeable listbox example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/listbox/listbox-rearrangeable.html)
- [Menu/Menu bar](https://www.w3.org/TR/wai-aria-practices-1.1/#Menu)
  - [Navigation menubar example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/menubar/menubar-1/menubar-1.html)
  - [Editor menubar example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/menubar/menubar-2/menubar-2.html)
- [Menu Button](https://www.w3.org/TR/wai-aria-practices-1.1/#Menubutton)
  - [Navigation menu button example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/menu-button/menu-button-links.html)
  - [Actions menu button example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/menu-button/menu-button-actions.html)
  - [Actions menu button example using aria-activedescendant](https://www.w3.org/TR/wai-aria-practices-1.1/examples/menu-button/menu-button-actions-active-descendant.html)
- [Radio Group](https://www.w3.org/TR/wai-aria-practices-1.1/#Radiobutton)
  - [Example using roving tabindex](https://www.w3.org/TR/wai-aria-practices-1.1/examples/radio/radio-1/radio-1.html)
  - [Example using aria-activedescendant](https://www.w3.org/TR/wai-aria-practices-1.1/examples/radio/radio-2/radio-2.html)
- [Slider](https://www.w3.org/TR/wai-aria-practices-1.1/#slider)
  - [Horizontal example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/slider/slider-1.html)
  - [Example with aria-orientation and aria-valuetext](https://www.w3.org/TR/wai-aria-practices-1.1/examples/slider/slider-2.html)
- [Slider (Multi-Thumb)](https://www.w3.org/TR/wai-aria-practices-1.1/#slidertwothumb)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/slider/multithumb-slider.html)
- [Spinbutton](https://www.w3.org/TR/wai-aria-practices-1.1/#spinbutton)
  - [Datepicker spinbuttons example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/spinbutton/datepicker-spinbuttons.html)
- [Table](https://www.w3.org/TR/wai-aria-practices-1.1/#table)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/table/table.html)
- [Tab](https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel)
  - [Example with automatic activation](https://www.w3.org/TR/wai-aria-practices-1.1/examples/tabs/tabs-1/tabs.html)
  - [Example with manual activation](https://www.w3.org/TR/wai-aria-practices-1.1/examples/tabs/tabs-2/tabs.html)
- [Toolbar](https://www.w3.org/TR/wai-aria-practices-1.1/#toolbar)
  - [Example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/toolbar/toolbar.html)
- [Tooltip](https://www.w3.org/TR/wai-aria-practices-1.1/#tooltip)
  - No working example
- [Tree View](https://www.w3.org/TR/wai-aria-practices-1.1/#treeview)
  - [File directory using computed properties](https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-1/treeview-1a.html)
  - [File directory using declared properties](https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-1/treeview-1b.html)
  - [Navigation treeview using computed properties](https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-1/treeview-1a.html)
  - [Navigation treeview using declared properties](https://www.w3.org/TR/wai-aria-practices-1.1/examples/treeview/treeview-1/treeview-1a.html)
- [Treegrid](https://www.w3.org/TR/wai-aria-practices-1.1/#treegrid)
  - [Treegrid email example](https://www.w3.org/TR/wai-aria-practices-1.1/examples/treegrid/treegrid-1.html)
- [Window Splitter](https://www.w3.org/TR/wai-aria-practices-1.1/#windowsplitter)
  - No working example

Find more examples at [WAI ARIA practices](https://www.w3.org/TR/2019/NOTE-wai-aria-practices-1.1-20190814/examples/)

## Other

- Following links will bring you to common patterns that should be followed when implementing a complex component that has no native semantic counterpart
  - [WAI-ARIA design patterns](https://www.w3.org/TR/wai-aria-practices-1.1)
  - [eBay Mind Patterns](https://ebay.gitbook.io/mindpatterns/)
- Accessibility acceptance success criteria testing checklist: [a11yengineeer.com](https://www.a11yengineer.com/)
  - Select application needs and a checklist will be generated to check if everything is implemented correctly
- More about web accessibility and ARIA
  - [Google Web Fundamentals](https://developers.google.com/web/fundamentals/accessibility)
  - [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
  - [WAI ARIA](https://www.w3.org/TR/wai-aria-1.1/)
  - [Using ARIA](https://www.w3.org/TR/using-aria/)
  - [Accessibility guidelines](https://www.w3.org/TR/WCAG21/)
- Storybook has an [accessibility addon](https://storybook.js.org/addons/@storybook/addon-a11y/) that can give you instant feedback about accessibility of the component

## SVGs

### 1. Export

When we export an icon from Figma or Zeplin, we should export the icon container instead of the actual icon. _Check the image_
![image](https://user-images.githubusercontent.com/55184443/115124509-edfa2e80-9fc2-11eb-8386-fa29ad4c0548.png)
In this case, we will export `Menu` as SVG instead of the `Icon` element.

> With this, every icon we export will have the exact box dimensions, which is easier to maintain in the long run.

### 2. Optimization

Before adding a new icon to our codebase, we should optimize it. [`svgo`](https://github.com/svg/svgo) is the go-to tool for this purpose, with [SVGOMG](https://jakearchibald.github.io/svgomg/) as its hosted UI. [Here are the preferred settings](https://gist.github.com/kristian240/bf7be2570e7cc8074718484130d5ae2e) that should give the optimal output.

### 3. Add to codebase

After we exported and optimized the icon, we can add it to our codebase. We will add this new icon in one of two directories:

#### a. `src/assets/icons`

Prior to using an SVG icon this way, check the following:

- Make sure that the SVG element has only the `viewBox` property (without `width` and `height`). The context surrounding the icon should define its dimensions.
- Sometimes, designers use the `<mask>` element in SVGs. Those elements are referenced by an ID, and if you use multiple SVGs per an HTML document, multiple `mask` elements will have the same ID. As a result, SVGs won't work as expected. Often these `mask` elements are simple to resolve manually so after resolving them make sure to remove them.

We should add an icon to this folder if it uses only one color and will be used in components like buttons and dropdowns and/or will be inlined with the code. The `fill` property of the icon source should be changed to `currentColor`. This way its color can be changed by setting the `color: ${someColor}` style in CSS.

React.js example:

```jsx
import AddIcon from 'src/assets/icons/icon-add.svg';

const AddButton = () => (
	<Button>
		<Icon as={AddIcon} color="primary" />
	</Button>
);
```

> For this to work in your repository, you need to configure `next-react-svg` or `svg-react-loader` or something similar.

#### b. `public/images`

If the image is using complex colors gradients/multiple colors/... it probably belongs to this category.

> Before adding it, you can check if this image could be smaller in size using PNG or JPG image formats. If this is the case, and the image doesn't need to scale dynamically, use that one instead of the SVG. If instead the image needs to change dimensions based on the viewport width for instance, use the SVG.

Example in code:

```jsx
const InstagramLink = () => (
	<Link>
		<Image src="/images/instagram-icon.svg" />
		Link to Instagram page
	</Link>
);
```

> “Passwords are like underwear: don’t let people see it, change it very often, and you shouldn’t share it with strangers.” – Chris Pirillo

There are multiple ways of doing auth, but in this chapter, we'll focus on the Single sign-on approach.

## Single sign-on (SSO)

Single Sign-On (SSO) is a method of authentication that allows users to access multiple systems and applications with a single set of login credentials. The SSO process typically starts when a user attempts to access a protected resource. Instead of prompting the user to enter their login credentials, the application redirects the user to an SSO service, which authenticates the user by checking their login credentials against an identity provider, such as a directory service or a database. Once the user is authenticated, the SSO service will generate a token, which is used to represent the user's identity.

The token is usually a JSON Web Token (JWT), which contains claims that are encoded with the user's identity, as well as other information such as the expiration date of the token. The token is then sent back to the application, which uses it to grant the user access to the protected resource.

The tokens are usually signed by the SSO service using a private key, which ensures that the token has not been tampered with and can be verified using a public key. The tokens can also be encrypted to ensure that the claims inside the token are not visible to anyone other than the intended recipient.

The SSO service also acts as a central location for managing and auditing access to all the systems and applications that use SSO. It allows IT administrators to manage and secure access, and with the use of tokens, it can also check for the token's expiration date and the scopes and audiences it's intended for.

### Benefits

There are several benefits to using Single Sign-On (SSO) for authentication:

- **Improved User Experience**: SSO eliminates the need for users to remember and manage multiple sets of login credentials, making it easier and more convenient for them to access the systems and applications they need.
- **Increased Security**: SSO reduces the risk of password reuse and sharing, which can lead to security breaches. Additionally, SSO can also improve security by requiring users to go through a stronger authentication process, such as multi-factor authentication, before granting access.
- **Increased Productivity**: SSO can save users time by eliminating the need to constantly log in and out of different systems. This can also improve productivity by allowing users to quickly access the resources they need to do their jobs.
- **Reduced IT Costs**: SSO can reduce the costs associated with managing multiple sets of login credentials and resetting forgotten passwords.
- **Better Compliance**: SSO can help organizations meet compliance requirements by providing a centralized location for managing and auditing access to sensitive information.

### Concerns

Implementing Single Sign-On (SSO) can present a number of challenges, such as managing user profile data, handling the creation and deletion of users, and ensuring the security of credentials. Among these challenges, the issue of keeping credentials safe is particularly important.

In this chapter, we will focus on addressing the concern of keeping credentials safe when implementing SSO in a JavaScript application. We will explore best practices and strategies for securing the SSO process, including handling and storing tokens securely, preventing cross-site scripting (XSS) and cross-site request forgery (CSRF) attacks, and using secure communication protocols. By understanding and addressing the issue of keeping credentials safe, we can ensure that the SSO implementation is secure and reliable for both users and IT administrators.

When it comes to saving credentials in the browser, HttpOnly Cookies are often the preferred method as they are not vulnerable to cross-site scripting (XSS) attacks. However, when using Single Sign-On (SSO), the credentials are usually provided in the form of tokens that are intended to be sent via the Authorization header.

While it may be tempting to simply store these tokens in the browser's localStorage, this can introduce security risks if any third-party code is present or if a user is able to add custom JavaScript to the application. Storing the tokens in regular Cookies may also not be the best solution as it defeats the purpose of using Cookies in the first place. In light of this, it's important to find a better and more secure way of handling and storing tokens in a JavaScript application when implementing SSO.

### How to do it right

The specification for Single Sign-On (SSO) provides general guidance on how to implement the process securely. However, in this chapter, we aim to take a more practical approach. We will provide concrete examples and specific steps for ensuring the security of credentials when implementing SSO in a JavaScript application.

#### With server-side rendering

When we're working on an app that might do API calls fro the server (e.g. fetching data for the server-side render), we need to have the token available on the server, which means that the cookie is the only option. In this case, we can use the approach the specification calls ["backend for frontend"](https://www.ietf.org/archive/id/draft-ietf-oauth-browser-based-apps-10.html#section-6.2). In general, that means that our backend is the SSO client and it should create a separate session for our client code:

1. Log in with a SSO provider
2. The backend logic handles the redirect URL, gets the tokens based on the activation code
3. The backend creates a session for the user and saves the tokens in the session
4. The backend redirects the user to the client app
5. Each time an authorized API call needs to be made, it needs to go trough our backend proxy, which will get the tokens, refresh them if necessary and then forward the API call with all the necessary auth headers. Those API calls should also include the CSRF tokens to prevent the CSRF attacks.

#### With client-side rendering

When all API calls are made from the browser, we can utilize a [proxy service worker](https://www.ietf.org/archive/id/draft-ietf-oauth-browser-based-apps-10.html#section-6.3.2) to intercept our requests. This approach is similar to using a backend proxy in the server-side rendering example, as it allows us to handle the SSO flow in the browser.
_Changesets_ is a lightweight tool that helps you manage versions and generate changelogs for packages in a monorepo (or single-package repository). By adding a small file describing each change, _Changesets_ can automatically bump versions, publish packages, and create release notes with minimal friction.

## Why Use Changesets?

1. **Immediate Documentation**: Document your changes while opening a PR instead of waiting for the final release. This ensures you never forget important details.
2. **Clear Separation of Concerns**: Changesets decouple the intent to change (patch, minor, major) from the act of publishing. Your changelogs and version bumps become transparent to the entire team.
3. **Easy Collaboration & Review**: Each pull request can include a changeset file that explicitly states how the package version should be updated and why. This fosters more meaningful code reviews.
4. **Automated Versioning**: When merged, changesets can automatically handle version bumps, changelog generation, and publishing. This saves time and reduces human error.
5. **Monorepo Ready**: Designed for multi-package repositories, Changesets resolve inter-package dependencies, ensuring consistent and reliable versioning across the codebase.

For more info, see the [official Changesets documentation](https://github.com/changesets/changesets).

## Getting started

### Install and initialize

Install the Changesets CLI in your repository:

```bash
pnpm install -D -E @changesets/cli
```

Then, initialize _Changesets_:

```bash
pnpm changeset init
```

This creates a hidden folder, `.changeset/`, with a base configuration file. You’re now ready to track changes in your repo.

### Adding a _Changeset_ to every Pull Request

Whenever you open a Pull Request, add a _changeset_ to describe how the changes affect the package(s).

1. **Creating a changeset**

After committing your code changes, run:

```bash
pnpm changeset
```

This interactive prompt asks:

- Which packages are affected? (_This question is skipped in single-package repositories_) Use the space bar to select one or more packages in a monorepo.

- Bump type (_patch, minor, major_)?
  - **patch** for backward-compatible bug fixes.
  - **minor** for new features that don’t break existing APIs.
  - **major** for incompatible API changes.

- Summary for this change - Use an impersonal tone, focusing on what changed and why (like commit messages).

2. **Commiting the changeset**

Once you select the affected packages, version bump type and write down summary of changes, a `.md` file is created in the `.changeset/` folder (the file name is automatically generated, e.g. `strange-bees-visit.md`):

```md
---
'@infinum/some-package': minor
---

Introduce a new method `doSomethingAwesome` and fix a small bug in the `init` function.
```

You should commit the `.changeset` file:

```bash
git add .
git commit -m "chore: add changeset for [feature or fix]"
```

And push your branch - this changeset becomes part of the PR for reviewers to see.

> Note: You don’t have to create a dedicated commit for your changeset. Feel free to include the changeset file in the same commit as your code changes. The key point is that the changeset exists for the release automation to reference, regardless of how it’s committed.

### Day-to-day example

1\. Pull Latest

```bash
git pull origin master
```

2\. Create or Switch to a Feature Branch

```bash
git checkout -b feat/improve-logging
```

3\. Make Your Code Changes

(Fix a bug, add a feature, etc.)

4\. Run `pnpm changeset` to create your changeset.

5\. Commit and Push

```bash
git add .
git commit -m "feat(logging): improve error logging format"
git push -u origin feat/improve-logging
```

6\. Open a PR

GitHub will show the changes, including the new `.md` in `.changeset/`.

7\. Review & Merge

Once approved and merged, the CI pipeline will handle version bumps and publishing automatically.

### Continuous Integration Setup

Although changesets can function without continuous integration (CI), it's recommended to use it with a CI system to automate versioning and publishing. You can utilize the [Github Action](https://github.com/changesets/action) provided by the changesets team.

To use the action, create a `.github/workflows/release.yml` file. Follow the instructions under the [With Publishing](https://github.com/changesets/action#with-publishing) section in the documentation, with minor adjustments. This flow updates the versions of changed packages and publishes them to npm registry.

```yml
name: Release

on:
  push:
    branches:
      # Make sure to check the branch name here; usual values are `main` and `master`
      - master

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4

      # Corepack makes sure to use correct Node.js version for your project, it requires having "engines" specified in package.json file
      # Read more about Corepack and advanced dependencies caching at: https://infinum.com/handbook/frontend/node/managing-node-npm-versions
      - name: 🗃️ Enable corepack
        run: corepack enable
        shell: bash

      - name: Setup Node.js
        uses: actions/setup-node@v4

      - name: Install Dependencies
        run: pnpm install --prod --frozen-lockfile

      - name: Create Release Pull Request or Publish to npm registry
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm ci:publish
          # if your repository is using conventional commits, you should use the following option (the message can be customized)
          # commit: 'ci: version packages'
        env:
          # GITHUB_TOKEN is required for creating a pull request and will be provided by the Github Action automatically
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # NPM_TOKEN is required for publishing to registry and needs to be provided manually
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      # This step will push tags to the repository after the packages are published and will create a new release on Github
      - name: Push git tag after publish
        if: steps.changesets.outputs.published == 'true'
        run: git push --follow-tags
```

Before using the action, ensure the following checklist is complete:

- Ask your TL, TD, or PE to add the NPM\_TOKEN to the repository secrets.
- Confirm that the `package.json` file has the `publish` script: `"ci:publish": "changeset publish"`.
- Ensure the package is built before publishing it to npm (optional).
- Verify that the Node version is correct.
- Confirm that the branch name is accurate.
- Ensure the `package.json` file has the `main` field.
- Verify that only relevant items will be published to the registry (e.g., no `__tests__` folder) by adding [a `.npmignore` file or using a files field in the `package.json` file](https://www.npmjs.com/package/npm-packlist) and running [pnpm pack](https://pnpm.io/cli/pack) command.
- Confirm that the `package.json` file has the `repository` field (with `directory` for monorepos).

### GitHub Actions Gotchas

If you actually want to deploy applications with changesets, not just publish new packages to NPM registry, there are 2 gotchas:

- Workflows can’t start other workflows.
- You can't trigger 3+ workflows on `push tags` at the same time.

But those issue can be tackled:

- For triggering new workflows: use a `Fine-Grained Personal Access Token`, so "a real user" is creating new workflows instead of default GitHub Actions user when using `${{ secrets.GITHUB_TOKEN }}`
- For triggering deploy workflows for multiple apps: switch to the `release published` trigger instead of `pushed tag`

Example `release published` trigger:

```yml
on:
  release:
    types: [published]
```

It has some drawbacks — either your own user will be creating all commits, pull requests, tags, and releases needed for deployment, or you'll need to create a dedicated user for that. Some organizations may need to pay for an additional seat, but it's usually not a big deal.

**Creating Fine-grained Personal Access Token**

Required repository permissions:

- **Contents** - Read and Write
- **Pull requests** - Read and Write
- **Metadata** - Read-only (mandatory by default)

> ⚠️ Warning! If possible, create a dedicated user for that, and it should have access only to this single repository. Alternatively, create this token on an organization level and limit repository access as needed.

After you’ve created the Fine-grained PAT, you have to add it to your repository secrets. In the examples below, it’s named `CHANGESETS_GITHUB_PAT`.

**Updated Release workflow**

Example `.github/workflows/release.yml`:

```yml
name: 📢 Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: 📢 Release
    runs-on: ubuntu-22.04
    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4
        with:
          token: '${{ secrets.CHANGESETS_GITHUB_PAT }}'

      - name: 💻 Node setup
        uses: ./.github/actions/node-setup

      - name: 🧑‍💻 Configure Git User
        run: |
          git config --global user.name "Bot Kamil"
          git config --global user.email "kamil@infinum.com"

      - name: 🏷️ Create Release Pull Request
        uses: changesets/action@v1
        with:
          publish: pnpm changeset tag
          setupGitUser: false
        env:
          GITHUB_TOKEN: ${{ secrets.CHANGESETS_GITHUB_PAT }}
          HUSKY: 0
```

- Custom `token` in `actions/checkout@v4`: Automates all Git commands (commit, tag, push, etc.) as your custom user (from PAT) instead of the default GitHub Actions user.
- _Node setup_ step: Install dependencies.
- _Configure Git User_ step: Required so that `changesets/action` can commit version changes (e.g., “Version Packages”).
- `with.publish: pnpm changeset tag`: Use this if you have any private repositories, or if you just want to tag instead of publishing to the NPM registry.
- `with.setupGitUser: false`: Prevents `changesets/action` from overriding your previously configured Git user.
- `GITHUB_TOKEN`: Should use the custom Fine-grained PAT.
- `HUSKY: 0`: Disables any Git hooks — your app should be analyzed and tested before the Release workflow runs.

### Changeset Bot

You can install [Changeset Bot](https://github.com/changesets/bot) to get additional automated PR comments. Once installed, if a PR lacks a changeset, the bot will prompt you to add one. This is highly recommended for teams to maintain consistent usage.

### Pre-Releases (Beta, Alpha, RC)

Pre-releases allow you to publish “unstable” versions (e.g., `1.2.0-beta.1`) for testing before a final release. See the [official docs](https://github.com/changesets/changesets/blob/main/docs/prereleases.md) for details.

> ⚠️ Warning! Prereleases are very complicated! Using them requires a thorough understanding of all parts of npm publishes. Mistakes can lead to repository and publish states that are very hard to fix.

Typical workflow:

1. Enter Pre-Release Mode

   ```bash
   pnpm changeset pre <tag>
   ```

   Usually `<tag>` is `beta`, but you can use `alpha`, `rc`, `next`, etc.

2. Version & Commit

   ```bash
   pnpm changeset version
   git add .
   git commit -m "chore: release beta"
   ```

3. Publish the Pre-Release

   ```bash
   pnpm changeset publish
   ```

   > ⚠️ Important! Use `changeset publish` instead of `pnpm publish` to respect pre-release mode.

4. Push Tags

   ```bash
   git push --follow-tags
   ```

   You can also manually create a GitHub release if desired.

5. Exit Pre-Release Mode

   ```bash
   pnpm changeset exit pre
   git add .
   git commit -m "chore: exit pre-release mode"
   ```

After this, the packages return to normal versioning.

## See it in action

_Changesets_ are already implemented in a few repositories. Check them out to see how they work:

- [js-linters](https://github.com/infinum/js-linters)
- [polyglot-cli](https://github.com/infinum/js-polyglot-cli)

## Resources

- [Changesets](https://github.com/changesets/changesets)
- [Changeset Bot](https://github.com/changesets/bot)
- [Changesets Github Action](https://github.com/changesets/action)

> If the reviews hurt they're probably right on some level. - Sean Lennon

In the Infinum JavaScript team we love code reviews. We love getting them and giving them. This document aims to show how a good pull request should look like (no matter what SCM solution or tool). The main idea is to give your reviewer as much context as possible to allow them to focus on the feature or fix you have delivered.

## Creating a pull request

Your pull request should have **all of the below**:

- The code should have been linted and prettified before the code review
- Pull requests should not be large and should contain a single feature
  - Create multiple pull requests in smaller chunks if needed
- Task ID (Productive, Jira, etc.)
- A title
- A description that includes
  - Links to the design files that you used
  - Relevant links to documentation outlining your work
  - A screenshot of a feature or fix you delivered

The following are extra but highly recommended:

- A summary of changes and reasoning behind them
- A TODO list of missing details on large pull requests
- A list of open questions if there are any
- A video demonstration of the feature

## Example

![Pull request example](/img/pr_example.png)

- Marked **A** title showing a concise description along with a task ID
- Marked **B** description containing relevant documentation and links
- Marked **C** a screenshot of the developed feature

## Implementing feedback

Once you fix up a comment leave a response that you've fixed that specific comment. This will help you reviewer do another pass on the feature when you hand it over for a re-review.

Going the extra mile would be to link the commit that fixes the comment.

If the pull request becomes stale in the mean time (diverges a lot form the base branch) consider merging the base branch back in so you get the review on possible merge conflicts as well.

## When and who merges the pull request?

When the code review is completed with an appropriate number of approvers having signed off the feature the code can be merged.

You, as the developer, know best when and how this code should be merged. You press the green merge button!

> Optimism is an occupational hazard of programming; feedback is the treatment. - Kent Beck

This guide should help you review code better. A good code review will provide a lot of useful things, but some of them are:

- a sense of security (that the feature works well),
- a learning opportunity for both parties,
- architectural check,
- code quality check.

## Language of the code review

- Be concise
- Do not ask, advise
- Do not assume the level of knowledge
- Be open for discussion, but do not bikeshed
- Recommend fixes instead of pointing out errors

### Good examples:

> this won't work because the function is `async`.

> this file should go to `components/shared` because this is an atom component and can be reused on another page

> I'm not sure this does what it's meant to do. Looking at the service as a whole the code should probably allow the end user to construct this out of exported functions.

### Bad examples:

> can you please update this function documentation as well?

> this is not according to our guidelines

> naming is not correct here

> pls fix.

## When do I review pull requests?

Reviewing a pull request could (and should) take time. This is not to be rushed since you vouch for the quality of the code that's on review.

Pull requests should not stay unattended for more than 24 hours. This means you should pick them up and start the review in that period. When you do them however is entirely up to you and your team.

This can be specifically hard to do if you review multiple projects or work in a larger team. If this is the case you might want to think about assigning a certain part of the day to do them.

Be sure to communicate this to your project manager so it gets reflected in your sprint availability.

Code review is an integral part of the development cycle and therefore should be time tracked on the appropriate task/service on the project.

## How do I review a pull request?

Start by reading the feature that's delivered. Look at the design files, get to know the business logic behind it, understand the requirements.

Next up is scanning the files for common errors or typos, etc. - things that stand out right away. Comment them and if they are blocking enough return the pull request to the developer.

You should have the project you're reviewing checked out locally and you should run **both** the project and the tests on **every** pull request. Your review is not complete unless you click through the feature and verify at least the happy path.

Take a look at the code coverage and look for missing things there, are all branches tested or even developed?

You, too, are taking part in the chain of quality assurance here.

## Common things to look out for

- If the code is not linted or reviewed return the pull request to the developer
- The code should be tested using unit tests
- The code should not lower the code coverage on the project
- The code should follow the design specification
- Tricky parts of the code that are hard to understand should have either inline documentation or a link to external documentation

Some of these checks can be automated on pull requests (e.g. code coverage). Talk to your resident devops to help you set this up.

## Responsibility

Every developer is responsible for their code. But - you as a reviewer share the responsibility as well when you sign off a feature and allow it to merge.
There are many tools for ensuring a constant level of code quality is maintained on a project. Different tools do different things in different ways. This handbook covers some of those tools.

If you have already read this section of the Handbook and are here just for the config files, [jump ahead](#putting-it-all-together) (+ [editor files](#editor-files)).

### Git hooks

Git hooks allow us to run scripts during various `git` commands. This verification step can be used to run various tools which ensure that the code satisfies some conditions before it is added to the repository. If the verification fails, the git command will abort.

No matter which code quality tools we use, git hooks are a great way to run those tools. There are multiple ways to add git hooks. For JavaScript projects, we recommend using [husky](https://github.com/typicode/husky).

Follow [usage](https://github.com/typicode/husky#usage) guidelines for installing Husky and add hooks.

After running all commands described in [usage](https://github.com/typicode/husky#usage) chapter, you should have `.husky` folder with hooks folder inside. For example, if you created `pre-commit` hook which runs `pnpm test` command, you should have `pre-commit` file in `.husky` folder, with following content

```sh
pnpm test
```

In this example, if you try pushing and the tests fail, code will not get pushed to the remote. We do not necessarily recommend running tests on push, it is just an example (there are better ways to run automated tests using a proper CI/CD set-up).

Most of our code quality tools are run on either `pre-commit` or `pre-push` hooks, so using git hooks is kind of a prerequisite for the rest of the Code quality handbook section.

Note: By design `husky install` must be run in the same directory as `.git`. You can change directory in your `prepare` script. Also, you will need to change directory in your hooks. For example, if you have `frontend` directory where you want to run `pre-commit` hook, your hook file might look like following

```sh
cd frontend && pnpm lint-staged
```

For more use cases please check [Husky documentation](https://typicode.github.io/husky/#/).

### Lint-staged

[Lint-staged](https://github.com/okonet/lint-staged) works hand-in-hand with commit hooks - pre-commit hook in particular. It allows us to run scripts only on those files which were staged for committing. This makes hooks run faster since they only need to run on a subset of project files instead of all of them. The assumption is that code quality tools have to be run only on modified code while the code that was untouched should already have been checked.

`Lint-staged` can be configured in [many ways](https://github.com/okonet/lint-staged#configuration). We prefer configuration in `.lintstagedrc` file in JSON format.

`Lint-staged` uses `glob` patterns which allow you to run different scripts on different file types/patterns.

Here is an example which runs `prettier` and `eslint` on all staged `.js` and `.ts` files, and `prettier` and `stylelint` on all staged `.scss` files via a pre-commit hook:

```js
// .lintstagedrc
{
  "**/*.{js,ts}": [
      "prettier --write"
      "eslint"
  ]
  "**/*.scss": [
      "prettier --write",
      "stylelint --customSyntax=scss"
  ]
}
```

```sh
pnpm lint-staged
```

What `lint-staged` does is it matches files to `glob` patterns and passes the list of files as an argument to scripts. Tooling developers should ensure that their scripts can receive the list of files in the correct format. Most common tools like eslint, tslint, stylelint and others are compatible with the way `lint-staged` passes the list of files.

It is important to note that `lint-staged` matches files to `glob` patterns in parallel and runs tasks on those matched groups in parallel as well. Within one matched group, the commands are executed in-order. There is an option to force `lint-staged` to process groups sequentially if you need to. In the above example `.scss` files will be processed in parallel with `.js` and `.ts` files. For `.js` and `.ts` files `eslint` will be executed first and only after it is done will `prettier` be executed.

Check the following chapters for specifics about Prettier, ESLint and Stylelint.

### Automatic code formatting with Prettier and IDE settings

![Bikeshedding](/img/work.png)

_Source: [XKCD](https://xkcd.com/1741/)_

Many people are very passionate about the way they format their code. While we appreciate everyone's opinion, we believe it is best to leave this bikeshedding to automated tooling. It might not format the code in a way that is satisfying to everyone, but it will be consistent across projects and, more importantly, it will format the code written by different people in the same way. This also eliminates discussions around formatting.

[Prettier](https://prettier.io/) is one of the most popular tools for this job. It is very opinionated and not very configurable. It might not be perfect, but it is a good way to ensure consistency when it comes to formatting and it format multiple different file types.

Here is our recommended Prettier configuration:

```js
// .prettierrc.json
{
  "$schema": "http://json.schemastore.org/prettierrc",
  "printWidth": 120,
  "endOfLine": "lf",
  "useTabs": true,
  "arrowParens": "always",
  "quoteProps": "as-needed",
  "bracketSpacing": true,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
}
```

If you are using Angular, make sure to add an override for templates parser:

```js
// addendum to the above .prettierrc.json
{
  ...
  "overrides": [{
    "files": "*.component.html",
    "options": {
      "parser": "angular"
    }
  }]
}
```

If you just added Prettier to an existing codebase, you should probably run it once and let it format the whole codebase. This will probably create a lot of modifications which you can skim through and if it checks out you can commit the changes.

It is possible that some things might break after Prettier is run. In particular, we noticed some issues with the way Prettier formats SCSS, so you might want to exclude SCSS from Prettier in case you notice issues:

```bash
# .prettierignore

# It sometimes breaks SCSS (https://github.com/prettier/prettier/issues/6092)
*.scss
```

If you do not notice issues with Prettier and SCSS, we recommend keeping Prettier on for SCSS files as well.

Developers should set up their code editors to run Prettier whenever they save a file. This is not a bullet-proof solution because some editors might not have support for this (either natively or via plug-ins). Going one step further, we recommend running Prettier via the pre-commit hook. This ensures that the committed code is formatted even if the developer who wrote it did not have his editor set up to format on file save.

```bash
npx husky add .husky/pre-commit "prettier --write"
```

Should generate

```sh
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

prettier --write
```

<a id="editor-files"></a>
To ensure editor settings are in-line with prettier settings, create a workspace `.vscode` settings and `.editorconfig` files:

```js
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.insertSpaces": false,
  "editor.detectIndentation": true
  "[scss]": {
    "editor.formatOnSave": false
  }
}
```

```bash
# .editorconfig
root = true

[*]
charset = utf-8
indent_style = tab
indent_size = 2 # GitHub uses this value for indentation size when showing code on the Web
insert_final_newline = true
trim_trailing_whitespace = true

[*.{yml,yaml}]
indent_style = space
```

### ESLint and TSLint

Even though [TSLint](https://palantir.github.io/tslint/) is deprecated, it is still used on some projects for legacy reasons. The main reason being that some custom rules packages have not yet migrated to ESLint. If your project does not use custom TSLint rules or you do not use TS, use [ESLint](https://eslint.org/).

### ESLint configuration

To maintain high code quality and consistency across JavaScript applications, follow a strict linting strategy. This configuration combines industry standards for JavaScript, TypeScript, and Framework-specific best practices.

#### Angular projects

When initializing or updating a project, extend the following recommended configurations to ensure a robust baseline:

| Config                          | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| `angular.configs.tsRecommended` | Official Angular linting for TypeScript.                  |
| `angular.configs.templateAll`   | Strict rules for Angular HTML templates.                  |
| `eslint.configs.recommended`    | Core JavaScript rules.                                    |
| `eslintConfigPrettier`          | Disables linting rules that might conflict with Prettier. |
| `tseslint.configs.recommended`  | TypeScript-specific best practices and formatting.        |
| `tseslint.configs.stylistic`    | TypeScript-specific best practices and formatting.        |

##### Project-Specific Rules

While the recommended sets cover the basics, we enforce additional rules to prevent common pitfalls in Angular (such as breaking Server-Side Rendering) and to keep the git history clean.

Add these to your overrides section:

```json
{
	"rules": {
		"no-console": ["error", { "allow": ["warn", "error"] }],
		"no-restricted-globals": [
			"error",
			{
				"name": "window",
				"message": "Use InjectionToken instead of direct window manipulation."
			},
			{
				"name": "document",
				"message": "Use InjectionToken instead of direct document manipulation."
			},
			{
				"name": "fdescribe",
				"message": "Do not commit fdescribe. Use describe instead."
			}
			{
				"name": "fit",
				"message": "Do not commit fit. Use it instead."
			}
		]
	}
}
```

#### React projects

For React and Next.js projects, use local ESLint flat configs (`eslint.config.mjs`) instead of shared legacy plugin presets.

Why:

- `js-linters` (`@infinum/eslint-plugin`) is deprecated for React/Next.js use cases.
- Maintaining one shared package across Angular, React, Next.js and different project constraints created too much maintenance overhead and upgrade friction.
- Local config composition is easier to evolve per project and lowers breaking-change risk.

Reference starter: [infinum/JS-React-Example](https://github.com/infinum/JS-React-Example).

`JS-React-Example` keeps reusable ESLint configs in `packages/configs`; each use case has its own module (`base`, `react`, `nextjs`, `typescript`, etc.), and projects build their lint setup by composing those modules.

##### Recommended configuration stack (React + Next.js)

Use these baseline config sets in React/Next.js apps:

| Config / Preset                         | Description                                                     |
| --------------------------------------- | --------------------------------------------------------------- |
| `pluginJs.configs.recommended`          | Core JavaScript correctness rules from `@eslint/js`.            |
| `tseslint.configs.stylisticTypeChecked` | Type-aware TypeScript rules and stylistic consistency.          |
| `pluginReact.configs['jsx-runtime']`    | React JSX runtime rules (no legacy `React` import requirement). |
| `pluginReactHooks.configs.recommended`  | Hooks safety (`rules-of-hooks` and dependency checks).          |
| `pluginNext.configs.recommended`        | Next.js framework rules.                                        |
| `pluginNext.configs['core-web-vitals']` | Additional Next.js performance and quality rules.               |
| `eslint-plugin-prettier/recommended`    | Prevents style-rule conflicts and integrates Prettier.          |

Required dev dependencies for flat config:

```bash
pnpm add -D eslint@^9 @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next eslint-plugin-prettier eslint-config-prettier globals
```

If `eslint-plugin-react-hooks` still expects older rule APIs in your setup, wrap it with `fixupPluginRules` from `@eslint/compat` (as done in `JS-React-Example`).

Minimal composition example:

```js
import baseConfig from '@infinum/configs/eslint/base';
import typescriptConfig from '@infinum/configs/eslint/typescript';
import reactConfig from '@infinum/configs/eslint/react';
import nextConfig from '@infinum/configs/eslint/nextjs';
import jestConfig from '@infinum/configs/eslint/jest';

export default [
	...baseConfig,
	...typescriptConfig,
	...reactConfig,
	...nextConfig,
	...jestConfig,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.eslint.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
```

##### Project-specific React/Next rules

On top of recommended presets, keep these extra rules where applicable:

```js
{
	files: ['**/*.{ts,tsx,js,jsx}'],
	rules: {
		'react/no-unknown-property': ['error', { ignore: ['css'] }],
		'react/self-closing-comp': ['warn', { component: true, html: true }],
		'react/prop-types': ['error', { skipUndeclared: true }],
		'react-hooks/exhaustive-deps': ['error', { additionalHooks: '(useSafeLayoutEffect|useUpdateEffect)' }],
	},
}
```

##### Custom Next.js rule: no hooks in `pages/` folder

If a project still uses the **Pages Router** (`pages/` or `src/pages/`), keep this custom rule.
For pure **App Router** projects (`app/` only), this rule is usually not needed.

```ts
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(() => '');

export default createRule({
	name: 'no-hooks-in-pages-folder',
	meta: {
		type: 'problem',
		docs: { description: 'Disallow React hooks in `pages` folder' },
		schema: [],
		messages: {
			noHooksInPagesFolder: "React hook '{{hookName}}' not allowed in {{filename}}",
		},
	},
	defaultOptions: [],
	create(context) {
		const forbiddenFolderRegex = /((\/|^)src\/pages\/|(\/|^)pages\/)/;

		const isReactHook = (node: TSESTree.CallExpression) =>
			node.callee.type === 'Identifier' && node.callee.name.startsWith('use');

		return {
			CallExpression(node) {
				const filename = context.filename;
				if (!forbiddenFolderRegex.test(filename)) return;
				if (!isReactHook(node)) return;

				context.report({
					node,
					messageId: 'noHooksInPagesFolder',
					data: {
						hookName: (node.callee as TSESTree.Identifier).name,
						filename,
					},
				});
			},
		};
	},
});
```

Register it in flat config as a local plugin:

```js
import noHooksInPagesFolder from './src/rules/no-hooks-in-pages-folder';

export default [
	// ...other config arrays
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		plugins: {
			local: {
				rules: {
					'no-hooks-in-pages-folder': noHooksInPagesFolder,
				},
			},
		},
		rules: {
			'local/no-hooks-in-pages-folder': 'error',
		},
	},
];
```

##### Migration from `js-linters`

If an existing project still uses legacy `extends` with `@infinum/eslint-plugin`, migrate it to flat config composition.

Legacy (`.eslintrc`):

```json
{
	"extends": [
		"plugin:@infinum/core",
		"plugin:@infinum/typescript",
		"plugin:@infinum/react",
		"plugin:@infinum/next-js",
		"plugin:@infinum/chakra-ui"
	]
}
```

Target (`eslint.config.mjs`):

```js
import baseConfig from '@infinum/configs/eslint/base';
import typescriptConfig from '@infinum/configs/eslint/typescript';
import reactConfig from '@infinum/configs/eslint/react';
import nextConfig from '@infinum/configs/eslint/nextjs';

export default [
	...baseConfig,
	...typescriptConfig,
	...reactConfig,
	...nextConfig,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.eslint.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
```

Migration checklist:

- Move from `.eslintrc*` to `eslint.config.mjs` (flat config).
- Upgrade `eslint` to v9 before enabling flat config composition.
- Install flat-config dependencies (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`).
- Replace plugin preset strings with imported config arrays.
- Keep TypeScript parser `project` config for typed rules (`tsconfig.eslint.json`).
- Re-add any project-specific overrides explicitly (they are no longer inherited implicitly).
- Add local custom rules (like `no-hooks-in-pages-folder`) only where they match the routing architecture.

#### Automation & License Headers

To ensure compliance across the team, we automate the maintenance of license headers and code style before any code is committed.

- Rule: Use the `header/header` ESLint rule to define the required license format.

- Workflow: Combine this with Husky and lint-staged to automatically check or inject headers during the pre-commit phase.

Note: This automation ensures that no file is pushed to the repository without the proper legal boilerplate, reducing manual overhead during code reviews.

### Stylelint

If you have no issues with prettier SCSS formatting and you decide to use Prettier, it is recommended to install [stylelint-prettier](https://github.com/prettier/stylelint-prettier) plugin and preset.

```js
{
  "plugins": ["stylelint-prettier"],
  "rules": {
    "prettier/prettier": true
  }
}
```

If you want to use stylelint, it is recommended to use [@infinumjs/stylelint-config](https://github.com/infinum/stylelint-config). In order to use it with prettier, please add [stylelint-config-prettier](https://github.com/prettier/stylelint-config-prettier).

```js
{
  "extends": [
    "@infinumjs/stylelint-config",
    "stylelint-config-prettier" // needed if you use prettier to format SCSS
  ]
}
```

### Putting it all together

Here is the complete example which runs TypeScript compilation check on all files, prettier, eslint and stylelint on an Angular (v10) project:

```js
{
  "scripts": {
    "prepare": "husky install",
    "tsc": "concurrently \"pnpm tsc:app\" \"pnpm tsc:spec\"",
    "tsc:app": "tsc --noEmit -p ./src/tsconfig.app.json",
    "tsc:spec": "tsc --noEmit -p ./src/tsconfig.spec.json"
  }
}
```

```js
// .lintstagedrc.json
{
  "**/*.{json,md,html}": [
    "prettier --write"
  ],
  "**/*.{js,ts}": [
    "prettier --write",
    "eslint"
  ],
  "**/*.css": "stylelint",
  "**/*.scss": [
    "prettier --write" // add or remove this line depending on whether you run stylelint on SCSS,
    "stylelint --customSyntax=post-scss"
  ]
}
```

```sh
pnpm tsc && pnpm lint-staged --config .lintstagedrc.json
```

```js
// .stylelintrc.json
{
  "plugins": ["stylelint-prettier"],
  "rules": {
    "prettier/prettier": true
  },
  "extends": [
    "@infinumjs/stylelint-config",
    "stylelint-config-prettier"
  ],
  "overrides": [
    {
      "files": ["*.scss", "**/*.scss"],
      "customSyntax": "postcss-scss"
    }
  ]
}
```

For this example, you will have to install the following `devDependencies`:

```bash
pnpm i -D -E concurrently husky lint-staged stylelint stylelint-prettier prettier tslint-config-prettier
```

Some notes:

- it is important to run `tsc` on all files because changes in staged files can affect compilation of unmodified files
- `tsc` is run on both the application `tsconfig` files and tests `tsconfig` files
- `concurrently` speeds up things by running tsc checks in parallel
- `prettier --write` is run separately for `.ts` and other files in order to prevent any possible race conditions before running TSLint (via `lint:ng`) and Prettier
  This is an opinionated collection of resources on how to start with CSS. It's mostly curated for folks new to CSS, but anyone can refresh their memory.

It consists of games, videos and articles split into 4 categories:

- basics - gives the idea of what CSS is, how to approach the learning process and covers some fundamental parts
- concepts - a more intermediate level resources that should be used as a reference for further learning
- useful resources and helpful tools - support for the previous categories

## 1. Basics:

- [CSS in 5 minutes](https://www.youtube.com/watch?v=Z4pCqK-V_Wo&feature=youtu.be&ab_channel=CodeDripbyAaronJack) (video) - really concise and basic overview of CSS.
- [The CSS podcast](https://thecsspodcast.libsyn.com/) - follow Una Kravets and Adam Argyle, Developer Advocates from Google, who gleefully breakdown complex aspects of CSS into digestible episodes covering everything.
- [How To Learn CSS](https://www.smashingmagazine.com/2019/01/how-to-learn-css/) - You don’t need to commit to memorizing every CSS Property and Value, as there are good places to look them up. There are some fundamental things, however, which will make CSS much easier for you to use. This article aims to guide you along your path of learning CSS.
- Selectors:
  - [CSS Diner](https://flukeout.github.io/) - a little game about all kinds of CSS selectors.
  - [Beginner Concepts: How CSS Selectors Work](https://css-tricks.com/how-css-selectors-work/)
- [The CSS cascade](https://2019.wattenberger.com/blog/css-cascade) - Or, How browsers resolve competing CSS styles (also touches on selectors and covers specificity).
- [CSS positioning](https://ishadeed.com/article/learn-css-positioning/) - an interactive article about CSS positioning.
- Flex:
  - [CSS Layout from Smashing Magazine](https://www.smashingmagazine.com/guides/css-layout/) - useful Flex resources.
  - [Flexbox froggy](https://flexboxfroggy.com/) - a game where you help Froggy and friends by writing CSS code.
  - [Flexbox30](https://www.samanthaming.com/flexbox30/) - learn Flexbox with 30 Code Tidbits.
  - [A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
  - [CSS Flexbox: 5 Real World Use Cases](https://ishadeed.com/article/flexbox-real-world-use-cases/)
- Grid:
  - [CSS Layout from Smashing Magazine](https://www.smashingmagazine.com/guides/css-layout/) - useful Grid resources.
  - [Grid Garden](https://cssgridgarden.com/) - a game where you write CSS code to grow your carrot garden.
  - [A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)

## 2. Additional Concepts:

- [What does 100% mean in CSS?](https://2019.wattenberger.com/blog/css-percents)
- [Spacing in CSS](https://ishadeed.com/article/spacing-in-css/)
- [Overflow in CSS](https://ishadeed.com/article/overflow-css/)
- [Colors in CSS](https://ishadeed.com/article/css-color/)
- [Learn Z-Index Using a Visualization Tool](https://thirumanikandan.com/posts/learn-z-index-using-a-visualization-tool)
- [An Ultimate Guide To CSS Pseudo Classes And Pseudo Elements](https://www.smashingmagazine.com/2016/05/an-ultimate-guide-to-css-pseudo-classes-and-pseudo-elements/)
- The complete guide to CSS media queries: [CSS tricks article](https://css-tricks.com/a-complete-guide-to-css-media-queries/) or [Polypane article](https://polypane.app/blog/the-complete-guide-to-css-media-queries/)
- Centering in CSS: [interactive tutorial from Ahmad Shadeed's](https://ishadeed.com/article/learn-css-centering/) or [CSS Tricks article](https://css-tricks.com/centering-css-complete-guide/)
- Hiding things in CSS: [CSS tricks](https://css-tricks.com/comparing-various-ways-to-hide-things-in-css/) or [Ahmad Shadeed's article](https://ishadeed.com/article/hiding-web/)
- [CSS transitions](https://css-tricks.com/almanac/properties/t/transition/)
- [CSS animation tutorial](https://jst.hashnode.dev/css-animation-tutorial)
- [Styling The Good Ol' Button Element](https://ishadeed.com/article/styling-the-good-old-button/) - how to create a custom button and covers all the edge cases. An amazing article in which you can get a felling on how to think when creating real-world components.
- [Responsible Web Applications](https://responsibleweb.app/) - "Any work you do now to ensure that your web application behaves responsively WILL be appreciated in the future."

## 3. Other useful resources:

- [Can I use...](https://caniuse.com/) - provides up-to-date browser support tables for support of front-end web technologies on desktop and mobile web browsers.
- Blogs
  - [CSS Tricks](https://css-tricks.com/)
  - [Ahmad Shadeed's personal blog](https://ishadeed.com/)
  - [Modern CSS solutions for old CSS problems](https://moderncss.dev/) from [Stephanie Eckles](https://thinkdobecreate.com/)
- [A Complete Guide to CSS Concepts and Fundamentals](https://www.taniarascia.com/overview-of-css-concepts/)
- [CSS tips for new devs](https://amberwilson.co.uk/blog/css-tips-for-new-devs/)
- [Web Design in 4 minutes](https://jgthms.com/web-design-in-4-minutes/)
- [Thinking like a frontend developer](https://ishadeed.com/article/thinking-like-a-front-end-developer/)
- [What Makes CSS Hard To Master](https://timseverien.com/posts/2020-12-06-what-makes-css-hard-to-master/)
- [Finding The Root Cause of a CSS Bug](https://ishadeed.com/article/finding-the-root-cause/)

## 4. Tools helpful in the learning process:

- [CSS specificity calculator](https://specificity.keegan.st/) - A visual way to understand CSS specificity.
- [CSS selectors explained](https://kittygiraudel.github.io/selectors-explained/) - Translate CSS selectors into plain English.
- [:nth-tester](https://css-tricks.com/examples/nth-child-tester/) - visual tool that helps better understanding nth-\* css pseudoselectors.
- [Layoutit](https://grid.layoutit.com/) - an interactive grid generator.
- [Easing functions cheatsheet](https://easings.net/en)
- [CSS Selectors cheatsheet](https://www.dropbox.com/s/h2hni9o1m1di989/CSS%20selectors%20cheatsheet.pdf) (or [Medium Source](https://medium.com/design-code-repository/css-selectors-cheatsheet-details-9593bc204e3f))
  Logging is a critical aspect of modern application development, providing visibility into the behavior and performance of your apps—both on the frontend and backend. By capturing essential data about requests, errors, and system events, logging helps developers troubleshoot issues quickly and optimize user experiences.

At Infinum, where we leverage technologies like Next.js, Angular, NestJS and AWS, we recognize the importance of robust, efficient, and scalable logging. After evaluating several popular logging libraries, we standardized on Pino as our primary choice for Node.js applications. Below, we compare Pino with other leading solutions and detail why we chose it.

## Pino vs. other solutions

To make an informed decision, we compared three widely-used logging solutions: [Pino](https://getpino.io/#/), [Winston](https://github.com/winstonjs/winston), and [Graylog](https://graylog.org/). Each offers distinct advantages and trade-offs.

| Feature/Aspect          | Pino                                                                                                                          | Winston                                                                        | Graylog                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Performance             | Optimized for speed with minimal overhead; ideal for real-time apps and SSR.                                                  | Slower due to a more feature-rich architecture.                                | Designed for centralized log aggregation, not Node.js performance.                             |
| JSON Logging            | Native JSON logging for structured data.                                                                                      | JSON is supported but requires more setup.                                     | Centralized logging solution; inherently JSON-based but requires standalone infrastructure.    |
| Integration with NestJS | Excellent with [nestjs-pino](https://github.com/iamolegga/nestjs-pino). Seamless middleware and dependency injection support. | Good with nestjs-winston, but heavier setup.                                   | Not a direct logger; requires a Graylog server or service.                                     |
| AWS Compatibility       | JSON-first approach simplifies usage with AWS services like CloudWatch, Lambda, and S3.                                       | Possible, but typically needs additional config.                               | Enterprise-level logging solution with its own setup, not directly tied to AWS.                |
| Ease of Use             | Simple, minimal boilerplate.                                                                                                  | Highly configurable but more complex to set up.                                | Requires installing and configuring a Graylog server, which can be overkill for many projects. |
| Development Experience  | Lightweight, with [pino-pretty](https://github.com/pinojs/pino-pretty) available for easy debugging.                          | Debugging is less streamlined out of the box.                                  | Focused on centralized logs; not meant for local debugging.                                    |
| Scalability             | Scales effortlessly in microservices or distributed systems.                                                                  | Scales reasonably but can add overhead.                                        | Centralized solution designed for large-scale log management, but introduces latency.          |
| Logging Destination     | Console, files, or integrations with ELK, AWS, etc.                                                                           | Built-in transports (files, databases, services).                              | Requires a dedicated Graylog server or cloud instance.                                         |
| Setup Complexity        | Low—straightforward to start using in NestJS or other Node.js frameworks.                                                     | Medium—flexible but requires deeper config, especially for advanced scenarios. | High—must maintain Graylog infrastructure (server, database, etc.).                            |
| Community & Ecosystem   | Growing focus on high-performance Node.js apps, strong contributor base.                                                      | Mature library with extensive community and plugins.                           | Wide enterprise adoption but more of a full-service logging platform.                          |

Summary:

- **Pino**: Best suited for Node.js applications that require high performance, structured JSON logging, and minimal overhead.
- **Winston**: Offers extensive transports and custom formatting but runs slower and requires more complex setup.
- **Graylog**: Primarily a centralized logging platform rather than a direct library. Ideal for enterprise-level aggregation but can be excessive for standard Node.js needs.

## Why we chose Pino

After comparing the three options above, we concluded that Pino aligns best with our requirements for the following reasons:

1. Performance Matters
   - In both frontend SSR and backend contexts, every millisecond counts. Pino’s minimal overhead ensures faster response times and lower latency.
   - NestJS-based services can experience heavy traffic, making a high-performance logger essential to maintain throughput.
2. Seamless Compatibility
   - The [nestjs-pino](https://github.com/iamolegga/nestjs-pino) integration hooks directly into NestJS middleware, providing transparent request and response logging.
   - Pino’s JSON-based approach makes it straightforward to send logs to AWS services like CloudWatch, Lambda, or S3 for centralized management.
   - Its simplicity also ensures it can be used across the diverse Node.js frameworks we employ: NestJS, Angular, Next.js, etc.
3. Developer-Friendly Experience
   - Pino’s development-friendly experience is enhanced with [pino-pretty](https://github.com/pinojs/pino-pretty), a separate dependency that formats logs into clean, human-readable output for debugging.
   - This drastically improves debugging efficiency and lowers the learning curve for team members.
4. Scalability for Distributed Systems
   - For microservices or distributed architectures on AWS, Pino’s structured logs are easier to integrate with OpenTelemetry, AWS X-Ray, or other centralized logging systems.
   - As our projects grow, Pino’s lightweight nature means we can scale without refactoring our logging strategy.

In short, Pino provides the right blend of speed, flexibility, and ease of use—making it the standout choice in our stack.

## Prerequisites

Regardless of the framework, you’ll typically need:

- `pino`: The core library for logging (not required for NestJS apps).
- `pino-pretty` (dev-only): Optional for human-readable server logs in development. Not recommended for production usage since it’s not as performant.

```bash
pnpm i -E pino && pnpm i -D -E pino-pretty
```

## Configuration

### Next.js

Create a `logger.ts` file - it will have Pino instance for both client and server side code:

```ts
// lib/logger/logger.ts

import pino from 'pino';

const isBrowser = typeof window !== 'undefined';
const isProd = process.env.NODE_ENV === 'production';

// Customize log levels for client and server
// In production, typically "info" or "warn" for server logs
// In development, "debug" is helpful
// You can also use custom environment variable like NEXT_PUBLIC_PINO_LOG_LEVEL
const level = isProd ? 'info' : 'debug';

// For demonstration, we’ll use the same log level for both client and server,
// but you can vary them if needed (e.g., higher level client logs, more detailed server logs).

export const logger = isBrowser
	? // Client-side config
		pino({
			browser: {
				// This option logs objects in a more readable console format
				asObject: true,
			},
			level,
		})
	: // Server-side config
		pino({
			level,
			// Example of redacting sensitive fields. Adjust to your needs.
			redact: {
				paths: ['req.headers.authorization', '*.password'],
				censor: '[REDACTED]',
			},
			// Use transport or additional options if you want to pipe
			// logs to an external service on the server side
			// e.g., pino.transport({ target: 'pino-pretty' }) for dev only
			transport: isProd ? undefined : { target: 'pino-pretty' },
		});
```

Add Pino dependencies to `serverExternalPackages` in `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	serverExternalPackages: ['pino', 'pino-pretty'],
};

export default nextConfig;
```

You can now use it in server components and route handlers:

```ts
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger/logger'; // adjust path as needed

export async function GET(request: NextRequest) {
	logger.info('Server-side log: GET /api/example');
	// ... your logic here
	return NextResponse.json({ success: true });
}
```

In client components, logs will be shown in a structured format (due to `asObject: true`):

```jsx
// app/home/page.tsx
'use client';

import logger from '@/lib/logger';

export default function HomePage() {
	logger.debug('Client-side debug log: /home');

	return <div>Welcome to the home page</div>;
}
```

### Angular

Create an Angular service that wraps the Pino logger, this allows you to configure and customize behavior for client-side logging.

```ts
// app/services/logger/logger.service.ts

import { Injectable } from '@angular/core';
import pino from 'pino';
import { environment } from '@/environments/environment';

@Injectable({
	providedIn: 'root',
})
export class LoggerService {
	private logger: pino.Logger;

	constructor() {
		this.logger = pino({
			level: environment.logLevel, // Configure log level based on environment
			browser: {
				asObject: true, // Optional: Format logs as objects for easier reading
			},
		});
	}

	// Expose the logger instance directly
	public getLogger(): pino.Logger {
		return this.logger;
	}
}
```

You can now use the logger directly in your components or services by retrieving the instance from `LoggerService`:

```ts
import { Component, OnInit } from '@angular/core';
import { LoggerService } from '@/services/logger/logger.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
	private logger = this.loggerService.getLogger();

	constructor(private readonly loggerService: LoggerService) {}

	ngOnInit(): void {
		this.logger.info('HomeComponent initialized');
		this.logger.debug('Debugging details', { userId: 123, action: 'viewedHome' });
	}
}
```

### NestJS

First you need to install required dependencies:

```bash
pnpm i -E nestjs-pino pino-http && pnpm i -D -E pino-pretty
```

In `app.module.ts` import Pino `LoggerModule`:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'nestjs-pino';

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
				transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
			},
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
```

In `main.ts` file, setup Pino as the default app logger:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	app.useLogger(app.get(Logger));

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

You can now use the default Nest `Logger` class, logs will be printed through Pino:

```ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';

@Controller()
export class AppController {
	private readonly logger = new Logger(AppController.name);

	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		this.logger.log('Hello World');

		return this.appService.getHello();
	}
}
```

## Customizing Pino

Pino’s power comes from its performance and flexibility. Although it’s designed to be simple out of the box, you can adapt it to fit advanced logging needs. Some key customization areas include:

1. Log Levels and Configuration Options
2. Redaction of Sensitive Data
3. Serializers for Custom Fields
4. Child Loggers
5. Hooks and Formatters
6. Transports (Built-In vs. Custom)

You can read more about all of the customization options in [Pino docs](https://getpino.io/#/).

> ⚠️ Warning: The more custom logic you add (especially hooks and synchronous transports), the more performance overhead you introduce - always be mindful.

## Best Practices

1. Use Environment-Based Log Levels
   - Configure log levels (`debug`, `info`, `warn`, etc.) depending on the environment. For example, use `debug` or `trace` in development, and `info` or `warn` in production. This keeps log volumes manageable and ensures meaningful logs in production.
2. Employ Redaction and Serializers
   - Always redact sensitive information (e.g., passwords, tokens) using Pino’s `redact` option.
   - Define serializers to transform or anonymize complex objects before they’re logged, preventing potential leaks of personally identifiable or sensitive data.
3. Leverage Child Loggers
   - Create child loggers for different application modules. This helps organize logs by scope (e.g., an auth logger vs. a payments logger), making it easier to filter and analyze logs in large codebases.
4. Avoid Blocking Transports
   - Write logs to `stdout` by default and rely on external tools (e.g., AWS CloudWatch, ELK stack) for ingestion. If you must use custom transports, ensure they don’t introduce blocking `I/O` or heavy synchronous operations that degrade app performance.
5. Keep Configuration Lean
   - Start with minimal configuration to maintain Pino’s performance edge. Only add hooks, advanced formatters, or complex transports if you truly need them—each feature may increase overhead or complexity.
6. Test and Monitor
   - Regularly review logs in development, staging, and production to ensure they provide actionable insights. Validate that sensitive data is properly redacted and that log levels match your operational needs.

## Naming rules

Naming things is hard. This sheet attempts to make it easier.

Although these suggestions can be applied to any programming language, I will use JavaScript to illustrate them in practice.

External link to community maintained cheatsheet:  
[Naming cheatsheet](https://github.com/kettanaito/naming-cheatsheet/blob/main/README.md)

## Naming Components

### HC/LC/b/p/s Pattern

There is a useful pattern to follow when naming functions:

```
high context (HC)? + low context (LC)? + base + part? + suffix?
```

Take a look at how this pattern may be applied in the table below.

| Name                | High context (HC) | Low context (LC) | Base name | Composite Part | Suffix     |
| ------------------- | ----------------- | ---------------- | --------- | -------------- | ---------- |
| `Card`              |                   |                  | `Card`    |                |            |
| `CardImage`         |                   |                  | `Card`    | `Image`        |            |
| `EventCard`         |                   | `Event`          | `Card`    |                |            |
| `UpcomingEventCard` | `Upcoming`        | `Event`          | `Card`    |                |            |
| `EventCardFallback` |                   | `Event`          | `Card`    |                | `Fallback` |

> **React note:** Avoid names that includes two base names, e.g. `ButtonLink` where `Button` is used as a LC and `Link` as a base. It's considered incorrect because it encapsulate two concerns, appearance (how ti looks) and behavioral (how it reacts to user input). You can avoid this by using polymorphic `as` prop, e.g. `<Button as="a" />`.

## Node version management

### Node release schedule

Node.js has defined and predictable release plan. Depending on the Node release version number, the Node release can go through 3 different phases: current, active(LTS) and maintenance. Be aware that odd-numbered versions will not go through active and maintenance phases, while even numbered will go through them all.

#### Current phase

Releases within this phase incorporate most non-major changes that end up on `nodejs/node` main branch. New major releases are branched out every six months. Even-numbered versions are scheduled for release in April, while odd ones are scheduled for October.

#### Active Long Term Support phase

Releases within this phase include new features, bug fixes and updates that have been audited and determined to be stable for the release. With each odd-numbered release, previous even-numbered release will transition to LTS phase. Versions in this phase will receive active support for 12 months after they entered LTS phase.

**You should always aim to use latest LTS version available on your project**

#### Maintenance phase

Releases within this phase will receive critical bug fixes and security updates for 18 months in case of LTS(even-numbered) and 2 months in case of regular(odd-numbered) releases after entering this phase.

### Ensuring same version of Node is being used on all environments

It is very important to keep the same version of Node across the environments. When you update the version of Node in your project, you should take appropriate actions that the new version is also propagated/updated on build/production servers by notifying people responsible for those environments. By not running the same versions you could run into unexpected problems with failing builds, incorrect dependencies etc. In case you are using server-side rendering, for example Next.js or Angular Universal you need to make sure that the same Node version is used on build server during the build step and on the production server when running the app.

### Managing versions

There are a couple of ways to manage versions of `Node.js`. All options are fine as long as you are proficient in installing, updating, and switching Node versions using your chosen method. However, the recommended approach is to use `Corepack` and `n`.

#### Corepack

`Corepack` is a tool that comes bundled with Node.js starting from version `16.10.0`. It provides a way to manage package managers (such as `npm`, `yarn`, and `pnpm`) without needing to install them globally. Corepack ensures that the specific package manager version specified in your project is used, which helps maintain consistency across different development environments.

**How Corepack works**

- **Bundling**: Corepack is included with `Node.js` distributions. You can enable it using the command corepack enable.
- **Specifying Package Managers**: In your project's package.json, you can specify which package manager and version your project should use.
- **Automatic Installation**: Corepack will automatically download and install the specified version of the package manager when you run related commands like `pnpm install`.

**Specifying package manager in package.json**

To ensure your project uses specific version of and `pnpm`, you should provide the `packageManager` field in your `package.json` file.

```json
{
	"packageManager": "pnpm@9.4.0"
}
```

**How Corepack manages versions**

By specifying the `packageManager` version in your `package.json`, Corepack will:

- **Check the package.json**: When you run commands that involve the package manager (e.g., installing dependencies), Corepack reads the `packageManager` field in your `package.json`.
- **Download and Install**: If the specified package manager version is not already installed, Corepack will automatically download and install it.
- **Use the Specified Version**: Corepack ensures that the commands are executed using the specified version of the package manager, ensuring consistency across different environments.

This process helps manage the appropriate versions of the package manager for your project, ensuring everyone working on the project uses the same versions.

**Using Corepack in Docker**

Using Corepack in your Docker environment ensures consistency between development and production environments. By leveraging Corepack:

- You avoid potential version mismatches by locking down the exact version of pnpm used across environments.
- You gain the benefits of pnpm's strict dependency management and efficient disk usage within your containerized application.

To use Corepack in a Dockerfile, you need to ensure that Corepack is enabled and properly configured for your project within the container environment. Here’s a step-by-step guide on how to set up Corepack with pnpm in a Dockerfile:

```dockerfile
# Use an official Node.js image as a base image
FROM node:22-alpine

# Enable Corepack, which is included by default in Node.js versions >= 16.10.0
RUN corepack enable

# Optional: Ensure the specific package manager version you want is installed
RUN corepack prepare pnpm@7.15.0 --activate

# Set the working directory in the container
WORKDIR /app
```

You don't need to specify the package manager in Dockerfile if you've provided `packageManager` field in your `package.json` file.

#### n

[n](https://github.com/tj/n) is a powerful and easy-to-use version manager for `Node.js`. It is highly recommended for managing versions due to its simplicity and effectiveness.

**How to Use n**

1. Install n globally using npm:

```bash
npm install -g n
```

2. Easily switch between different Node.js versions using:

```bash
n <version>
```

For example, to switch to Node.js version 14.17.0:

```bash
n 14.17.0
```

3. Ensure your `package.json` specifies the `Node.js` version:

```json
{
	"engines": {
		"node": "20.15.1"
	}
}
```

4. Automatic Version Switching: Use the `n auto` command to switch `Node.js` versions based on the engines field:

```bash
n auto
```

Specifying `engines` field and using `n` ensures that the correct version of `Node.js` is always used for your project, helping to prevent compatibility issues.

## Package Manager Guidelines

### Overview of Package Managers

A package manager is a tool that automates the process of installing, upgrading, configuring, and managing project dependencies. For JavaScript and Node.js projects, there are three popular package managers: npm, yarn, and pnpm. Each package manager offers unique features and benefits that cater to different development workflows.

At Infinum, we’ve chosen pnpm as the default package manager due to its superior performance, disk space efficiency, and advanced dependency management features.

#### npm

`npm` (Node Package Manager) is the default package manager that comes bundled with Node.js. It has been around for a long time and is the most widely used package manager in the Node.js ecosystem.

**Key Features:**

- Default and widely adopted package manager.
- Comes pre-installed with Node.js.
- Straightforward CLI for installing and managing packages.
- Global package installation support.

**Drawbacks:**

- Uses more disk space due to duplicate installations of packages.
- Slower dependency resolution compared to modern alternatives.

#### Yarn

`yarn` is an alternative to npm created by Facebook to address performance and reliability concerns with npm. It was built to be faster and more deterministic by introducing features like a lockfile and offline caching.

**Key Features:**

- Fast and deterministic installations due to the lockfile mechanism.
- Offline mode support.
- Workspaces feature for managing monorepos.
- Improved security with stricter integrity checks.

**Drawbacks:**

- While fast, it can still suffer from disk space inefficiencies.
- Yarn’s newer features are often outpaced by improvements in pnpm.

#### pnpm (Preferred)

`pnpm` is the latest evolution in package management for Node.js. It introduces a unique approach to storing dependencies that dramatically improves performance and efficiency. Instead of duplicating package files across projects, pnpm uses a content-addressable storage mechanism that links packages from a shared location on your system.

### Why We Chose pnpm as Our Default Package Manager

We have standardized on pnpm for several reasons:

1. **Performance:** pnpm consistently outperforms npm and yarn in terms of installation speed. This results in quicker setup times for developers and faster CI/CD pipelines.
2. **Disk Space Efficiency:** By leveraging a content-addressable file system, pnpm avoids redundant package installations, significantly reducing disk space usage in larger projects.
3. **Stricter Dependency Management:** pnpm enforces a more consistent dependency tree, helping to avoid "dependency hell" that can occur with other package managers.
4. **Monorepo Support:** pnpm’s workspace feature makes it the best choice for monorepo setups, allowing you to manage multiple related packages within a single repository.
5. **Community Adoption:** pnpm is rapidly gaining adoption and is widely supported across popular libraries and frameworks.

#### Phantom Dependencies in npm and Yarn

One common issue that arises with both npm and yarn is the problem of **phantom dependencies**. These are dependencies that your project can access but are not explicitly listed in your `package.json` or defined as part of your direct dependency tree. This can lead to unpredictable behavior and introduces several risks in your project.

**How Phantom Dependencies Occur**

Phantom dependencies typically occur due to the following reasons:

1. **Hoisting Behavior**: Both npm and yarn use a process called _hoisting_ where dependencies are moved to a top-level node\_modules directory. As a result, dependencies that are nested (i.e., dependencies of other dependencies) might be hoisted to the root directory. This can make them accessible to your project even though they aren’t directly listed as dependencies.

2. **Implicit Dependency Access**: When a nested dependency is hoisted, it becomes available in your project’s node\_modules, even if it is not explicitly declared. This makes it possible for you to accidentally use a package that your project does not officially depend on.

3. **Incorrectly Configured Dependencies**: Sometimes developers may inadvertently use packages that are brought in as transitive dependencies (dependencies of dependencies). Since these dependencies are not declared in the `package.json` file, your project might rely on them without explicitly managing them.

**Why Phantom Dependencies Are Risky**

Phantom dependencies pose several risks:

1. **Fragile Builds**: Because phantom dependencies are not listed in your `package.json`, they can disappear unexpectedly if they are no longer included by the original package that brought them in. This could lead to sudden build failures or bugs when you least expect them.

2. **Unreliable Environment Replication**: If another developer or a CI/CD pipeline installs your project’s dependencies, the exact hoisting behavior might differ based on subtle differences in the environment, node\_modules structure, or even the order of installations. This makes it hard to guarantee that the same dependencies are available across all environments.

3. **Version Conflicts**: Phantom dependencies can introduce version conflicts. Since they are not explicitly managed, you might end up using an incompatible version of a dependency that was hoisted due to the resolution strategy of npm or yarn.

4. **Security and Compliance Risks**: Unmanaged dependencies increase the chance of missing critical security updates, as you are not actively monitoring or managing these packages. Additionally, if your project is audited for licensing or security, phantom dependencies might introduce unexpected issues.

**How pnpm Avoids Phantom Dependencies**

Unlike npm and yarn, pnpm uses a unique approach where each package has its own isolated node\_modules structure. This prevents packages from accessing dependencies that are not explicitly declared in their own `package.json` file. If a package tries to access a dependency that is not listed, pnpm throws an error, enforcing strict and clear dependency management.

This strictness ensures that your project is always explicit about its dependencies, reducing the likelihood of unpredictable bugs, version conflicts, or build failures due to phantom dependencies.

#### Deppelgangers

In the context of npm and yarn, "doppelgangers" are a type of issue that arises due to the way these package managers handle dependency installations. Doppelgangers refer to situations where different versions of the same dependency are installed multiple times across a project, leading to duplication, inconsistencies, and potential conflicts. This problem is particularly relevant when dealing with large or complex dependency trees.

**Understanding Doppelgangers in npm and Yarn**

When using npm or yarn, dependencies are resolved and installed in a way that can lead to multiple versions of the same package being installed in different parts of the node\_modules structure. This happens because each package in the tree may have its own specific version of a dependency that doesn’t match other versions requested by different packages.

For example:

- Package A requires `lodash@4.17.0`.
- Package B requires `lodash@4.16.0`.

In npm or yarn, both versions may be installed separately, leading to redundant copies of lodash scattered across the project. This duplication can waste disk space, slow down installations, and lead to inconsistencies, especially if different versions of the same package behave differently.

**Why We Chose pnpm to avoid Doppelgangers**

pnpm takes a fundamentally different approach to dependency management that directly addresses the doppelganger problem. Instead of installing dependencies in a flat or deeply nested structure, pnpm uses a content-addressable storage system where all versions of a package are stored globally on the filesystem and linked into your project’s node\_modules using hard links or symlinks.

This approach offers several key advantages:

- **No Redundant Installations**: With pnpm, different versions of the same package are never redundantly installed. If a version of a package is already present in the global store, it is simply linked to where it’s needed. This eliminates the doppelganger issue entirely.
- **Consistent Dependency Resolution**: pnpm enforces a strict dependency tree that ensures only the correct and intended versions of packages are used. This minimizes the risk of conflicts that can arise from duplicate installations.
- **Efficient Disk Usage**: By storing each version of a package only once and linking it as needed, pnpm drastically reduces the disk space used by node modules, even in large projects with many dependencies.
- **Improved Performance**: Because pnpm avoids redundant downloads and installations, it’s faster to install dependencies, especially in projects with complex dependency trees.

### Getting Started with pnpm

To start using pnpm, you first need to install it globally:

```bash
npm install -g pnpm
```

You can then use pnpm just like any other package manager, but with some enhancements.

#### Installing Dependencies

To install all dependencies listed in your package.json, run:

```bash
pnpm install
```

#### Adding new dependencies

To add a new package as a dependency, use:

```bash
pnpm add <package-name>
```

For example:

```bash
pnpm add express
```

To add development dependency:

```bash
pnpm add -D jest
```

To add dependency with exact latest version instead of one with caret:

```bash
pnpm add -E storybook
```

#### Installing dependencies

To install all dependencies listed in package.json:

```bash
pnpm install
```

To install only the production dependencies (i.e., those listed under dependencies in package.json):

```bash
pnpm install --prod
```

To ensure that the pnpm-lock.yaml file is up to date and installation doesn't regenerate it, which is useful in CI environments to ensure that the lockfile is consistent with what's committed:

```bash
pnpm install --frozen-lockfile
```

To install packages from the local cache only, without trying to reach the internet:

```bash
pnpm install --offline
```

To install packages from the local cache if they exist there, and download from the internet if they're not cached:

```bash
pnpm install --prefer-offline
```

You can also combine multiple flags together, which is useful in CI/CD, for example:

```bash
pnpm install --prod --prefer-offline --frozen-lockfile
```

To remove unnecessary files from the local store to save space:

```bash
pnpm store prune
```

#### Updating and removing dependencies

To list all installed packages and their versions:

```bash
pnpm list
```

To list all outdated dependencies in the project:

```bash
pnpm outdated
```

To check for known security vulnerabilities in your dependencies:

```bash
pnpm audit
```

To update all dependencies to their latest versions according to the semver range specified in package.json:

```bash
pnpm update
```

To remove a package from package.json and update lockfile:

```bash
pnpm remove <package-name>
```

#### Running scripts

Scripts defined in your package.json can be run using:

```bash
pnpm run <script-name>
```

For example:

```bash
pnpm run build
```

You can also use shorthand:

```bash
pnpm build
```

#### Managing Workspaces (Monorepos)

If you’re working with a monorepo, pnpm makes it easy to manage multiple packages using workspaces. You define your workspace in a pnpm-workspace.yaml file:

```yml
packages:
  - 'packages/*'
```

This setup allows you to run commands across all packages and share dependencies efficiently.

To run a script in all packages, use:

```bash
pnpm -r run <script-name>
```

To run a command only in specified packages, use:

```bash
pnpm --filter <package-name> <command>
```

#### Checking Dependency Health

To audit your project’s dependencies for vulnerabilities:

```bash
pnpm audit
```

### Conclusion

While npm and yarn are popular choices, pnpm offers significant advantages that make it the ideal package manager for our development workflow. Its speed, efficiency, and robust dependency management align with our goals of building scalable and maintainable software.

By adopting pnpm as our default, we ensure that our projects are fast, efficient, and consistent across all environments, ultimately improving productivity and reducing friction in our development process.
Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need to build your React applications.

## Getting started

### Installation:

```
pnpm i -E @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

For more about setup read [docs](https://chakra-ui.com/docs/getting-started)

### Setup provider:

For Chakra UI to work correctly, you need to set up the `ChakraProvider` at the root of your application.
Under the hood Chakra UI is using [emotion ThemeProvider](https://github.com/chakra-ui/chakra-ui/blob/develop/packages/system/src/providers.tsx)

Example:

```jsx
import { ChakraProvider } from "@chakra-ui/react";

function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default App;
```

Note:

- For Next.js, you need to set this up in `pages/_app.tsx`
- For Create React App, you need to set this up in `index.tsx`

For including `<CSSReset />` just add `resetCSS` prop to `<ChakraProvider>`

[All provider props](https://chakra-ui.com/docs/getting-started#chakraprovider-props)

### Style props

Style props are a way to alter the style of a component by simply passing props to it. It helps to save time by providing helpful shorthand ways to style components.

Style props should be used for one-off styles (up to max 3 props):

```tsx
<Button display="block" mt="md">
	Click me!
</Button>
```

Components that have more than 3 styles should be moved to separate component. To further improve readability, it is advised to move every `Box` or `Flex` component to a separate component, with a descriptive name.

```tsx
const ListWrapper = chakra(Box, {
	baseStyle: {
		shadow: 'lg',
		rounded: 'lg',
		bg: 'white',
	},
});
```

For more about style props read [docs](https://chakra-ui.com/docs/features/style-props)

### The `sx` prop

`sx` prop works similar to `style` prop. It takes an object with styles.

Example:

```tsx
<Button
	sx={{
		display: 'block',
		mt: 'md',
		color: 'primary.100',
		mx: 12,
	}}
>
	Click me!
</Button>
```

### The `__css` prop

`__css` prop is similar to `sx` but it is designed **ONLY** for internal use (hence the private prefix `__`).
The main difference is that `__css` prop will be merged before `sx` prop ([github](https://github.com/chakra-ui/chakra-ui/blob/085891be806b855af90b86367f5b26e8151c3ff5/packages/system/src/system.ts#L106)).
We should **ONLY** use it for building primitive `core` components.

```jsx
import { chakra, HTMLChakraProps, ThemingProps, useStyleConfig } from '@chakra-ui/react';
import { __DEV__ } from "@chakra-ui/utils";

export interface CardOptions {};

export interface CardProps
  extends HTMLChakraProps<"div">,
    CardOptions,
    ThemingProps<"Card"> {};

export const Card = forwardRef<CardProps, "div">(({ variant, ...rest }, ref) => {
  const styles = useStyleConfig("Card", { variant });

  return <chakra.div ref={ref} __css={styles} {...rest} />;
});

if (__DEV__) {
  Card.displayName = "Card"
}
```

### Chakra Factory

Chakra factory serves as an object of chakra JSX elements, and also a function that can be used to enable custom component receive chakra's style props.

```tsx
import { chakra } from '@chakra-ui/react';

// preferred way!
chakra('button', {
	baseStyle: {
		shadow: 'lg',
		rounded: 'lg',
		bg: 'white',
	},
});

// using sx prop
<chakra.button
	sx={{
		shadow: 'lg',
		rounded: 'lg',
		bg: 'white',
	}}
>
	Click me
</chakra.button>;
```

This reduces the need to create custom component wrappers and name them. Syntax is available for common html elements. See the reference for the full [list of elements](https://github.com/chakra-ui/chakra-ui/blob/main/packages/system/src/system.utils.ts#L9) supported. Beside list of elements, we can pass a function as [see custom components](#custom-component-example)

Chakra factory will be defined with base style and can be overridden by `sx` prop because `baseStyle` is merged before `sx`. Components created using chakra factory can be overridden by also using chakra factory ([merge order](https://github.com/chakra-ui/chakra-ui/blob/085891be806b855af90b86367f5b26e8151c3ff5/packages/system/src/system.ts#L104))

Example:

```tsx
const Button = chakra('button', {
	baseStyle: {
		bg: 'white',
	},
});
```

**Update (14.05.2021.)**

Previously we had this example:

```tsx
const FbButton = chakra(Button, {
	baseStyle: {
		bg: 'primary.500',
	},
});
```

We decided this is not the way to go and instead we should make special `colorScheme` in the theme.

Theme:

```ts
// ./src/styles/theme/foundations/colors.ts
const colors = {
	facebook: {
		50: '#E8F4F9',
		100: '#D9DEE9',
		200: '#B7C2DA',
		300: '#6482C0',
		400: '#4267B2',
		500: '#385898',
		600: '#314E89',
		700: '#29487D',
		800: '#223B67',
		900: '#1E355B',
	},
};

// ./src/styles/theme/components/button.ts
function variantSolid(props: Dict) {
	const { colorScheme } = props;

	if (colorScheme === 'facebook') {
		return {
			bg: 'facebook.500',
		};
	}

	return {
		bg: `${colorScheme}.200`,
	};
}

const variants = {
	solid: variantSolid,
};

export default {
	variants,
};
```

Usage:

```tsx
const ExampleForm = () => {
	return (
		<form>
			// ...some inputs
			<Button colorScheme="facebook" />
		</form>
	);
};
```

> NOTE: `facebook` color scheme was used just for demonstration purpose, you can do the similar thing with any other social button. Chakra UI already supports `facebook`, `messenger`, `whatsapp`, `twitter`, `telegram` color schemes OTB. You can find the example [here](https://chakra-ui.com/docs/form/button#social-buttons)

>

#### Custom component example

For example `react-datepicker` can be wrapped in chakra factory function so we can pass `sx` or style props to `<DatePicker />`

Example:

```tsx
import DatePicker from 'react-datepicker';
import { chakra } from '@chakra-ui/react';

const StyledaDatepicker = chakra(DatePicker);

export const Datepicker = (props) => <StyledaDatepicker w="100%" bg="blue.100" {...props} />;
```

Chakra factory function will pass `className` to `DatePicker input` component with all styles. In this case `input` will be rendered with custom `bg` and `width` styles.

For more about chakra factory read [docs](https://chakra-ui.com/docs/features/chakra-factory)

#### The `as` polymorphic prop

The `as` prop is a feature that all Chakra UI components have and it allows you to pass an HTML tag or component to be rendered.

`as` prop (`polymorphic prop`) is a feature of emotion borrowed from styled-components

- [emotion as prop](https://emotion.sh/docs/styled#as-prop)
- [styled-components polymorphic prop](https://styled-components.com/docs/api#as-polymorphic-prop)

It allows us to use all of the `Button` props and all of the `a` props without having to wrap the `Button` in an `a` component.

Example:

```tsx
<Button as="a" href="https://chakra-ui.com/docs/getting-started">
	Chakra UI docs
</Button>
```

In the example above the `a` element will be rendered as a `Button` component.
The `as` prop can also be another React component:

```tsx
<Button as={Link} someLinkProp={value}>
	Chakra UI docs
</Button>
```

- `Button` will be rendered as `Link` component
- `Link` props will become available on `Button`
- `Link` and `Button` styles will be combined

For more info about `as` prop read [docs](https://chakra-ui.com/docs/features/style-props#the-as-prop)

### Setup custom theme

If you need to customize the default theme to match your design requirements, you can use `extendTheme` from `@chakra-ui/react`.

Example:

```jsx
import { extendTheme } from '@chakra-ui/react';

const overrides = {
	colors: {
		primary: {
			100: '#ff0000',
			80: '#ff1a1a',
		},
	},
};

const theme = extendTheme(overrides);

export default theme;
```

For more info about setup read [docs](https://chakra-ui.com/docs/getting-started)

## Theming rules

The theme object is where you define your application's color palette, type scale, font stacks, breakpoints, border radius values, and more. Theme overrides are placed in `src/styles/themes` folder.

Theming with Chakra UI is based on the [Styled System Theme Specification](https://system-ui.com/theme/)

Example:

```ts
const overrides = {
	colors: {
		primary: {
			100: '#ff0000',
			80: '#ff1a1a',
		},
	},
};
```

Except objects, theme override can take a function:

```ts
const overrides = {
	colors: (props) => {
		const { colorMode } = props;

		return {
			primary: {
				100: colorMode === 'dark' ? '#ff0000' : '#ffffff',
				80: '#ff1a1a',
			},
		};
	},
};
```

Then in `props` we have access button props, `theme` object and `colorMode`.

#### `chakra-ui/theme-tools`

Chakra has a whole pallet of useful helpers:

- `mode(lightMode, darkMode)(props)` function is the same as `colorMode === "dark" ? darkMode : lightMode`.
- `orient` define `vertical` and `horizontal` style for component: `<Divider orientation="horizontal | vertical" />`
- `transparentize` helper to make a color transparent `transparentize('blue.100', 0.3)`
- `darken` darken a specified color `darken('blue.100', 0.5)` (there is also `lighten`, `blacken`, `whiten`)

For more about `theme-tools` check out [github](https://github.com/chakra-ui/chakra-ui/tree/develop/packages/theme-tools/src)

Theme folder structure:

```bash
src
└── styles
    └── theme
        ├── index.ts # main theme endpoint
        ├── styles.ts # global styles
        ├── foundations # colors, typography, sizes...
        │   ├── font-sizes.ts
        │   └── colors.ts
        └── components # components styles
            └── button.ts
```

### Colors

Color naming should a single value or an object with keys in range from `50` to `900`.

Example:

```ts
export const colors = {
	white: '#ffffff',
	primary: {
		50: '#f6faff',
		100: '#d7e9fd',
		200: '#c0dcfc',
		300: '#a7cefb',
		400: '#8abdfa',
		500: '#68aaf8',
		600: '#3d92f6',
		700: '#0070f3',
		800: '#0064d8',
		900: '#0055b9',
	},
};
```

#### How to generate colors

We recommend adding a palette that ranges from `50` to `900`. Tools like [Themera](https://themera.vercel.app/), [Smart Swatch](https://smart-swatch.netlify.app/), [Coolors](https://coolors.co/232020-553739-955e42-9c914f-748e54) or [Palx](https://palx.jxnblk.com/) are available to generate these palettes.

Sometimes you can get different or incomplete color palette from designer.
For example, designer provided us with only one `primary` color value `#68aaf8`.
In this case you can use this tool [color-scheme-builder](https://color-scheme-builder.vercel.app/) to generate the color palette while retaining the exact color value.

### Pseudo props

Pseudo props in ChakraUI can be passed as props to component. Full list of props can be found in [docs](https://chakra-ui.com/docs/features/style-props#pseudo)

Example:

```tsx
<Button
	bg="blue.100"
	_hover={{
		background: 'white',
	}}
>
	Submit
</Button>
```

Also pseudo elements can be used in theme or in chakra factory:

```tsx
const Card = chakra('div', {
	baseStyle: {
		bg: 'blue.100',
		_hover: {
			bg: 'white',
		},
	},
});

// or
const Card = chakra('div', {
	baseStyle: {
		bg: 'blue.100',
		':hover': {
			bg: 'white',
		},
	},
});
```

### Global styles

Global styles are theme-aware styles you can apply to any html element globally.

They are defined in `src/styles/theme/styles.ts` file.

Example:

```ts
const overrides = {
	styles: {
		global: {
			body: {
				fontFamily: 'body',
				bg: 'white',
				color: 'primary.200',
			},
			'*': {
				boxSizing: 'border-box',
			},
		},
	},
};
```

### Responsive

Chakra UI supports responsive styles out of the box. Instead of manually adding @media queries and adding nested styles throughout your code, Chakra UI allows you to provide object and array values to add mobile-first responsive styles.

> Under the hood `@media(min-width)` media query is used to ensure mobile-first

Chakra UI default breakpoints:

```ts
export const breakpoints = {
	sm: '30em',
	md: '48em',
	lg: '62em',
	xl: '80em',
};
```

Here's how to interpret this syntax:

- `base`: From `0em` upwards
- `md`: From `48em` upwards
- `lg`: From `62em` upwards
- `xl`: From `80em` upwards

For responsive styles, array or object syntax can be used.

```tsx
// array syntax
<Text fontSize={['24px', '40px', '56px']}>Lorem Ipsum is simply dummy text</Text>
```

```tsx
// object syntax
<Text fontSize={{ base: '24px', md: '40px', lg: '56px' }}>Lorem Ipsum is simply dummy text</Text>
```

In case we need to skip a certain breakpoint, `null` is passed at that position in the array to avoid generating unnecessary CSS.

Example:

```jsx
<Text fontSize={['24px', null, '56px']}>Lorem Ipsum is simply dummy text</Text>
```

Array and Object syntax work for every style prop in the theme specification, which means you can change most properties at a given breakpoint. Preferred way is to use array.

To create custom breakpoints read [docs](https://chakra-ui.com/docs/features/responsive-styles#customizing-breakpoints).

_NOTE: there is an issue with having `strict: false` in tsconfig when using `createBreakpoints`.
Error that breaks the build: `Type '(() => string) & (() => string)' is not assignable to type 'string'`. Current workaround is to add `strictNullChecks: true` to tsconfig. ([github issue](https://github.com/chakra-ui/chakra-ui/issues/3372))_

For more about responsive styles read [styled-system responsive styles docs](https://styled-system.com/responsive-styles/)

### Custom components style

Chakra UI has a specific API for styling components. Most components have default or base styles `baseStyle`, styles for different sizes `sizes`, and styles for different visual variants `variants`.

Components styles are defined in `theme/components/<component-name>.ts`
Each component style will export these objects:

- `baseStyles`
- `sizes`
- `variants`
- `defaultProps`

`baseStyle` are styles that all button types share.

```tsx
const baseStyle: StyleObjectOrFn = {
	lineHeight: '1.2',
	borderRadius: 'md',
	_focus: {
		boxShadow: 'outline',
	},
	_disabled: {
		opacity: 0.4,
		cursor: 'not-allowed',
		boxShadow: 'none',
	},
	_hover: {
		cursor: 'pointer',
	},
};
```

`variants` represents visual style.

```tsx
const variants: { [variant: string]: StyleObjectOrFn } = {
  solid: {
    bg: 'primary.100',,
    color: 'white',
    _hover: {
      bg: 'primary.400',
    },
    _disabled: {
      bg: 'neutral.200',
    }
  },
  outline: (props: Dict): SystemStyleObject => ({
    bg: 'transparent',,
    border: '1px solid',
    borderColor: 'primary.100',
    _hover: {
      bg: 'primary.100',
    }
  }),
};
```

`sizes` determine all the component sizes like `width`, `height`, `font-size` etc

```tsx
const sizes: { [size: string]: StyleObjectOrFn } = {
	sm: {
		h: 8,
		minW: 8,
		fontSize: 'sm',
		px: 3,
	},
	xs: (props: Dict): SystemStyleObject => ({
		h: 6,
		minW: 6,
		fontSize: 'xs',
		px: 2,
	}),
};
```

Naming used for sizes:

- `lg`
- `md`
- `sm`
- `xs`

`defaultProps` are default values for `size` and `variant`

```tsx
const defaultProps = {
	variant: 'solid',
	size: 'md',
};
```

For more info about custom component styles read [docs](https://chakra-ui.com/docs/theming/customize-theme#customizing-component-styles)

### Color mode

When you use the ChakraProvider at the root of your app, you can automatically use color mode in your apps. By default, most of Chakra UI component are dark mode compatible. To handle color mode manually in your application, use the `useColorMode` or `useColorModeValue` hooks.

> Tip: Chakra stores the color mode in localStorage and uses CSS variables to ensure the color mode is persistent.

#### useColorMode

`useColorMode` is a React hook that gives you access to the current color mode, and a function to toggle the color mode.

```tsx
function Example() {
	const { colorMode, toggleColorMode } = useColorMode();
	return (
		<header>
			<Button onClick={toggleColorMode}>Toggle {colorMode === 'light' ? 'Dark' : 'Light'}</Button>
		</header>
	);
}
```

#### useColorModeValue

`useColorModeValue` is React hook that takes 2 arguments, first is value for light mode and second is value for dark mode, and returnees the the value based on the active color mode

```tsx
const value = useColorModeValue(lightModeValue, darkModeValue);
```

### Style 3rd party components

In this example we will style [react-select](https://react-select.com) with Chakra UI

First we need to create custom style object in theme

```tsx
// style/theme/components/react-select.ts
const ReactSelect = {
	baseStyle: () => ({
		container: {
			bg: 'black',
			p: 8,
		},
		menu: {
			color: 'blue.100',
			bg: 'blue.500',
			padding: 8,
		},
	}),
};
```

Keys in `baseStyle` can be one of:

- clearIndicator
- container
- control
- dropdownIndicator
- group
- groupHeading
- indicatorsContainer
- indicatorSeparator
- input
- loadingIndicator
- loadingMessage
- menu
- menuList
- menuPortal
- multiValue
- multiValueLabel
- multiValueRemove
- noOptionsMessage
- option
- placeholder
- singleValue
- valueContainer

Reade more about react-select style objects in [docs](https://react-select.com/styles#style-object).

After we have `ReactSelect` theme object, we need to add that to `theme.components`

```tsx
// style/theme/index.ts
const overrides = {
	colors,
	// ...
	components: {
		Button,
		ReactSelect,
		// ...
	},
};
```

Now we can create Select component in components folder:

```tsx
const selectStyle = {
	container: (base, { theme }) => {
		return {
			...base,
			...theme.container,
		};
	},
	menu: (base, { theme }) => ({
		...base,
		...theme.menu,
	}),
};

const Select = (props) => {
	const styles = useStyleConfig('ReactSelect', props);

	return <ReactSelect theme={css(styles)(useTheme())} styles={selectStyle} {...props} />;
};
```

Each key added to the theme needs to be added to `selectStyle`.

Additionally, custom components can be added to react-select like `SelectContainer`

Example:

```tsx
const SelectContainer: FC<ContainerProps<BoxProps>> = ({ children, ...rest }) => {
	return (
		<components.SelectContainer {...rest}>
			<chakra.div sx={rest.selectProps.sx}>{children}</chakra.div>
		</components.SelectContainer>
	);
};
```

This will allow us to use `sx` prop on select component.

```tsx
<Select sx={{ mt: 12 }} options={[]} />
```

### React hook form example

This [example](https://chakra-ui.com/guides/integrations/with-hook-form) shows how to build a simple form with Chakra UI form components and the React Hook Form form library.

## Avoid usage of `:first-child` CSS selector with Emotion 10

If `:first-child` CSS selector is used in server-side rendered applications, React will show this warning in the console:

```
The pseudo class ":first-child" is potentially unsafe when doing server-side rendering. Try changing it to ":first-of-type"
```

Default server-side rendering in Emotion 10 renders the `<style>` tag inline with the component, instead of extracting everything inside `<head>`, similarly to "shadow CSS" in Web Components.
This approach enables streaming and requires no additional configuration, but does not work with nth child or similar selectors.

Here is an example of the `:first-child` selector:

```jsx
import styled from '@emotion/styled';

const Text = styled.p`
	color: gray;
	&:first-child {
		color: black;
	}
`;

export default () => (
	<div>
		<Text>Title</Text>
		<Text>Subtitle</Text>
	</div>
);
```

This is the DOM structure generated on the server-side:

```html
<div>
	<style data-emotion-css="1fyxi0m">
		.css-1fyxi0m {
			color: gray;
		}

		.css-1fyxi0m:first-child {
			color: black;
		}
	</style>
	<p class="css-1fyxi0m">Title</p>
	<style data-emotion-css="1fyxi0m">
		.css-1fyxi0m {
			color: gray;
		}

		.css-1fyxi0m:first-child {
			color: black;
		}
	</style>
	<p class="css-1fyxi0m">Subtitle</p>
</div>
```

Since the first child is a `<style>` instead of a `<p>` element, the `:first-child` selector won't work.

### Solution

Use `:first-of-type`, `:last-of-type` or `:nth-of-type` selectors.

> Read more about an alternative SSR setup in the [official documentation](https://emotion.sh/docs/ssr).
> In the next sections we will cover some topics related to React ecosystem used inside our company.

## Next.js Framework

[Next.js](https://nextjs.org/) is a production ready framework for building React applications.

- [Official documentation](https://nextjs.org/docs/getting-started)
- [Learn next](https://nextjs.org/learn/basics/create-nextjs-app)
- [Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Handbook Introduction](/books/frontend/react/getting-started/nextjs)

### Typescript

Next.js supports TypeScript by default and has built-in types for pages and the API.

- [Get started with TypeScript in Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript).

If you are unfamiliar with Typescript you can go through [documentation](https://www.typescriptlang.org/docs/home.html) or play with it in a [playground](https://www.typescriptlang.org/play/index.html).

> Next.js uses `SWC`, and it does not support features that require type information since it focuses on syntax transformation without checking types. Because of that `namespaces` or `const enums` will not work because those require type information to transpile, and `export =` or `import =` cannot be cleanly transpiled to ES module syntax (ESM).

### Prettier

Prettier is an opinionated code formatter that supports many languages
and integrates with most editors. By using Prettier we can achieve consistent code across all the project without spending too many time and energy on PR reviews.
We are obligated to use it on every project.

You can start using it by adding this VSCode plugin https://github.com/prettier/prettier-vscode and creating `.prettierrc` in the root of your project.

Here is an example of `.prettierrc`:

```json
{
	"$schema": "http://json.schemastore.org/prettierrc",
	"printWidth": 120,
	"endOfLine": "lf",
	"useTabs": true,
	"arrowParens": "always",
	"quoteProps": "as-needed",
	"bracketSpacing": true,
	"singleQuote": true,
	"semi": true,
	"trailingComma": "es5"
}
```

#### OPTIONAL:

You can enable `formatOnSave` in VSCode by creating `.vscode/settings.json` and adding these settings:

```
{
  "editor.formatOnSave": true,
}
```

This will format your code every time save file.

### Eslint

We use [Eslint](https://eslint.org/) to find and fix problems in our JavaScript code.

- [Eslint config React JS](https://www.npmjs.com/package/@infinumjs/eslint-config-react-js)
- [Eslint config React TS](https://www.npmjs.com/package/@infinumjs/eslint-config-react-ts)

### Testing

Automated testing is very important in software development. It gives us the assurance that code won't break when we add new features or change some existing implementation. You can read more about how to test in a [separate testing chapter](https://infinum.com/handbook/books/frontend/react/testing-best-practices).

### Internationalization

We use [polyglot-cli](https://www.npmjs.com/package/polyglot-cli) for managing translations and [react-i18next](https://react.i18next.com/) with [next-i18next](https://www.npmjs.com/package/next-i18next) for implementing internationalization in React applications.

Now that you have everything set and ready, you can start with the tutorials and official documentation explained in the [next chapter](/books/frontend/react/official-documentation).
Next.js supports some very cool features which can be used in different kinds of projects. For example, some projects with public pages can't be built with create-react-app (CRA) because it doesn't support server-side rendering, which makes SEO much harder. So, in projects that require SSR, a different stack must be used that would probably include something like Express on top of node, and custom Webpack and Babel configurations.

Also, any customization of Webpack or Babel inside CRA requires ejecting which is a one-way operation, or using tools like [CRACO](https://craco.js.org/docs/) which are breaking the "guarantees" that CRA provides. From that point onward, you are responsible for maintaining configuration files.

Multiple custom configuration files is something that we want to avoid.
Next.js solves above-stated problems and allows us to use a single stack for many different projects. Also, Next.js introduces some handy features, which come built-in:

- Code splitting
- Hybrid Static & Server Rendering
- Automatic static optimization
- Page prefetching
- Dynamic import of modules
- Built-in Zero-Config TypeScript Support
- Automatic, internationalized routing
- Image optimization
- Middleware
- API Routes
- SEO Optimization
  If you're searching for the tutorial to kick off learning React, you could first check [the official docs](https://react.dev/).

## Learn concepts

In case you're a type of person which prefers to learn the concepts before typing any code, head to [Learn React](https://react.dev/learn) which covers basic principles of React, but also dives in advanced topics like [managing state](https://react.dev/learn/managing-state), and [escaping hatches](https://react.dev/learn/escape-hatches). You should also see [Rules of React](https://react.dev/reference/rules) to help you write well organized, safe, and composable applications.

We recommend to check the basic principles first and have that settled in before exploring advanced features.

## Learn by doing

And for those who prefer learning by typing their own code, visit [Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe) which explores React concepts by building a tic-tac-toe game. This will cover all you need to know in a couple steps:

- [Setup](https://react.dev/learn/tutorial-tic-tac-toe#setup-for-the-tutorial)
- [Overview](https://react.dev/learn/tutorial-tic-tac-toe#overview)
- [Completing the game](https://react.dev/learn/tutorial-tic-tac-toe#completing-the-game)
- [Adding time travel](https://react.dev/learn/tutorial-tic-tac-toe#adding-time-travel)

And for best learning experience, feel free to combine the two approaches and have some fun as well. Don't forget to check out [other useful resources](/books/frontend/react/other-useful-resources) to expand your knowledge even further.
Official documentation seems a bit dry for you and you prefer learning by watching? Worry not! We got you. Check out the tutorials which helped our team grow their knowledge:

- [Codecademy React Course](https://www.codecademy.com/learn/react-101) interactive course to learn React from scratch with hands-on exercises
- [React tutorial](https://react-tutorial.app/) build supermarket shopping app in an interactive environment
- [Udemy tutorial](https://www.udemy.com/course/react-the-complete-guide-incl-redux/) which covers hooks, Redux, routing, Next.js, Animations and more
- [Full Stack Open ](https://fullstackopen.com/en/) free online course that covers React, Redux, Node.js, MongoDB, GraphQL, and TypeScript

And for non-beginners, expand your knowledge by reading or subscribing to some of these:

- [Overreacted](https://overreacted.io/)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)
- [Epic React](https://epicreact.dev/articles/)
- [React.js blog](https://react.dev/blog)
- [Egghead](https://egghead.io/q/react)
  ![React](/img/react.svg)

[React](https://reactjs.org/) is not a framework, instead it is a JavaScript library for building user interfaces. It is component based, meaning that by assembling simple building blocks - components - you can make a complex UI.
With React you will use the declarative programming paradigm for building component based systems which could be reused anywhere.

In the next few chapters we will cover everything from [styling components](/books/frontend/react/chakra-ui), through the [folder structure](/books/frontend/react/project-structure), all the way to [testing](/books/frontend/react/testing-best-practices). First take a look at the React [ecosystem](/books/frontend/react/ecosystem) used in our company, and afterwards start with the [official documentation](/books/frontend/react/official-documentation) to get a grasp on elementary concepts. This guide will show you best practices on how to utilize your new knowledge. Since there is a lot to cover, give yourself enough time for everything to sink in and revisit the handbook occasionally to refresh your knowledge.

So let’s get started 💪 💪

## React Libraries to use

### React Frameworks

- [next.js](https://github.com/vercel/next.js) - The React Framework

### React Styling and Component Libraries

- [chakra-ui](https://github.com/chakra-ui/chakra-ui/) - Simple, Modular & Accessible UI Components for your React Applications
  - [emotion](https://github.com/emotion-js/emotion) (Used by ChakraUI) - CSS-in-JS library designed for high performance style composition
  - [styled-system](https://github.com/styled-system/styled-system) (Used by ChakraUI) - Style props for rapid UI development
- [radix-ui/primitives](https://www.radix-ui.com/primitives) - Unstyled, accessible, and highly composable low-level components for building React applications. Designed to provide the base structure and functionality without styling, allowing developers to build custom-styled components while retaining accessibility and flexibility
- [radix-ui/themes](https://www.radix-ui.com/) - A collection of customizable and accessible themes for Radix Primitives. It includes pre-built themes with thoughtfully crafted color schemes, ensuring good contrast and usability, and it provides a starting point for creating visually cohesive applications
- [styled-jsx](https://github.com/vercel/styled-jsx) - Full, scoped, and server-rendered CSS for Next.js applications. Styled-JSX enables scoped CSS with standard CSS syntax, supporting the use of dynamic styling and ensuring that styles are isolated to individual components, which is especially useful for server-side rendering in Next.js

### React State Management

- [datx](https://github.com/infinum/datx) - A MobX data store
- [TanStack Query](https://www.npmjs.com/package/@tanstack/react-query) - Hooks for fetching, caching and updating asynchronous data in React

### Forms

- [react-hook-form](https://github.com/react-hook-form/react-hook-form) - React Hooks for forms validation (Web + React Native)

### React Components

- [react-select](https://github.com/JedWatson/react-select) - The Select Component for React.js
- [react-datepicker](https://github.com/Hacker0x01/react-datepicker/) - A simple and reusable datepicker component for React
- [react-virtuoso](https://github.com/petyosi/react-virtuoso) - An elegant virtual list component for React
- [@tanstack/react-virtual](https://tanstack.com/virtual/latest) - Headless UI for Virtualizing Large Element Lists
- [@tippyjs/react](https://github.com/atomiks/tippyjs-react) - The complete tooltip, popover, dropdown, and menu solution for the web, powered by Popper
- [downshift](https://github.com/downshift-js/downshift) - A set of primitives to build autocomplete, combobox or select dropdown React components
- [react-collapse](https://github.com/nkbt/react-collapse) - Component-wrapper for collapse animation with react-motion for elements with variable (and dynamic) height
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown component for React
- [react-slider](https://github.com/zillow/react-slider) - Accessible, CSS agnostic, slider component for React
- [react-qr-code](https://github.com/rosskhanas/react-qr-code) - A QR code generator for React and React Native
- [react-modal](https://github.com/reactjs/react-modal) - Accessible modal dialog component for React
- [react-cool-inview](https://github.com/wellyshen/react-cool-inview) - React hook to monitor an element enters or leaves the viewport (or another element)
- [react-avatar-editor](https://github.com/mosch/react-avatar-editor) - Small avatar & profile picture component that allows resizing and cropping uploaded images using a intuitive user interface
- [react-rating](https://github.com/dreyescat/react-rating) - A rating react component with custom symbols
- [react-compound-slider](https://github.com/sghall/react-compound-slider) - A small React slider with no opinion on markup or styles
- [react-slick](https://github.com/akiran/react-slick) - React carousel component
- [@datepicker-react/hooks](https://github.com/tresko/react-datepicker/tree/master/packages/hooks) - An easily internationalizable, accessible, mobile-friendly datepicker library for the web, build with styled-components
- [react-headroom](https://github.com/KyleAMathews/react-headroom) - Hide your header until you need it

### React Animation Libraries

- [react-transition-group](https://github.com/reactjs/react-transition-group) - An easy way to perform animations when a React component enters or leaves the DOM
- [react-spring](https://github.com/pmndrs/react-spring) - A spring physics based React animation library
- [framer-motion](https://github.com/framer/motion) - Open source, production-ready animation and gesture library for React

### React Chart Libraries

- [recharts](https://github.com/recharts/recharts) - Redefined chart library built with React and D3
- [nivo](https://github.com/plouc/nivo) - nivo provides a rich set of dataviz components, built on top of the awesome d3 and Reactjs libraries

### React Code Style

- [eslint](https://github.com/eslint/eslint) - Find and fix problems in your JavaScript code
- [eslint-config-react-ts](https://github.com/infinum/js-linters/tree/master/packages/eslint-config-react-ts) - Infinum's ESLint React TypeScript shareable config
- [prettier](https://github.com/prettier/prettier) - Prettier is an opinionated code formatter

### React Development Tools

- [storybook](https://github.com/storybookjs/storybook) - Development environment for UI components

### React Testing

- [jest](https://github.com/facebook/jest) - Delightful JavaScript Testing
- [react-testing-library](https://github.com/testing-library/react-testing-library) - Simple and complete React DOM testing utilities that encourage good testing practices
- [react-hooks-testing-library](https://github.com/testing-library/react-hooks-testing-library) - Simple and complete React hooks testing utilities that encourage good testing practices
- [@testing-library/user-event](https://github.com/testing-library/user-event) - Simulate user events for react-testing-library
- [jest-dom](https://github.com/testing-library/jest-dom) - Custom jest matchers to test the state of the DOM
- [identity-obj-proxy](https://github.com/keyz/identity-obj-proxy) - Useful for mocking webpack imports
- [ts-jest](https://github.com/kulshekhar/ts-jest) - TypeScript preprocessor with sourcemap support for Jest
- [jest-svg-transformer](https://www.npmjs.com/package/jest-svg-transformer) - Transform svgs for for jest+react to declutter snapshots
- [@emotion/jest](https://github.com/emotion-js/emotion/tree/master/packages/jest) - Jest testing utilities for emotion

### Other Libraries

- [react-focus-lock](https://github.com/theKashey/react-focus-lock) - Focus locking
- [@jesstelford/react-portal-universal](https://github.com/jesstelford/react-portal-universal) - Generic wrapper for React's createPortal allowing for rendering portals on the server
- [date-fns](https://github.com/date-fns/date-fns) - Modern JavaScript date utility library
- [date-fns-tz](https://github.com/marnusw/date-fns-tz) - Complementary library for date-fns v2 adding IANA time zone support
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary) - Simple reusable React error boundary component
- [react-window](https://github.com/bvaughn/react-window) - React components for efficiently rendering large lists and tabular data
- [nprogress](https://github.com/rstacruz/nprogress) - For slim progress bars like on YouTube, Medium, etc
- [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) - Javascript error handling tool for Bugsnag. Monitor and report JavaScript bugs & errors.
- [@bugsnag/plugin-react](https://github.com/bugsnag/bugsnag-js/tree/master/packages/plugin-react) - A @bugsnag/js plugin for React
- [focus-visible](https://github.com/WICG/focus-visible) - Polyfill for `:focus-visible`
- [react-use-gesture](https://github.com/pmndrs/react-use-gesture) - Bread n butter utility for component-tied mouse/touch gestures in React
- [react-use-measure](https://github.com/pmndrs/react-use-measure) - Utility to measure view bounds
- [googlemap-react](https://github.com/googlemap-react/googlemap-react) - Easier Google Map Integration for React projects
- [react-merge-refs](https://github.com/gregberge/react-merge-refs) - React utility to merge refs
- [slate](https://github.com/ianstormtaylor/slate) - A completely customizable framework for building rich text editors. (Currently in beta.)
- [libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js#libphonenumber-js) - Validator/formatter for phone numbers (has seaparate validators for different countries)
- [react-dropzone](https://react-dropzone.js.org/) - Simple React hook to create a HTML5-compliant drag'n'drop zone for files.

### Localization

- [i18next](https://github.com/i18next/i18next) - i18next: learn once - translate everywhere
- [next-intl](https://next-intl-docs.vercel.app/) - A lightweight Next.js library for internationalization, supporting server components, dynamic routing, and translations with JSON files, designed for simpler integration without extensive configuration.

### Next.js plugins

- [next-compose-plugins](https://github.com/cyrilwanner/next-compose-plugins) - Cleaner API for enabling and configuring plugins for Next.js
- [@svgr/webpack](https://www.npmjs.com/package/@svgr/webpack) - A webpack loader that transforms SVG files into React components, enabling inline SVG usage with customizable properties, making it easier to import and manipulate SVGs as React components
- [next-seo](https://github.com/garmeeh/next-seo) - Managing your SEO easier in Next.js

## Organizing components

### UI Components

When adding UI components, you should be able to group them in three root domains:

**1. Core Domain**
Core components are the smallest building blocks, highly reusable and composable. Examples include Card and Section.

**2. Shared Domain**
Shared components are built out of core components and shared between feature components. Examples include InputField and MainLayout.

**3. Features Domain**
Feature components are specific to a particular feature or section of the app. Note that the structure of the features folder may vary from project to project. Developers should evaluate if this pattern is suitable for their specific project requirements.

Folder naming rules:

1. `kebab-case` folder name indicates domain name
2. `PascalCase` folders and filenames should be used for components naming

#### Pages Router

```
src
├── components
│   ├── core
│   │   ├── Section
│   │   │   └── Section.tsx
│   │   └── Card
│   │       └── Card.tsx
│   ├── features
│   │   ├── home
│   │   │   ├── HomeHeaderSection
│   │   │   │   └── HomeHeaderSection.tsx
│   │   │   └── HomeTodoListSection
│   │   │       └── HomeTodoListSection.tsx
│   │   └── todo
│   │       ├── TodoHeaderSection
│   │       │   └── TodoHeaderSection.tsx
│   │       └── TodoCreateFormSection
│   │           └── TodoCreateFormSection.tsx
│   └── shared
│       ├── fields
│       │   └── TextField
│       │       └── TextField.tsx
│       ├── todo
│       │   ├── TodoCard
│       │   │   └── TodoCard.tsx
│       │   ├── TodoList
│       │   │   └── TodoList.tsx
│       │   └── TodoCreateForm
│       │       └── TodoCreateForm.tsx
│       └── utilities
│             ├── BugsnagErrorBoundary
│             │   └── BugsnagErrorBoundary.tsx
│             └── Meta
│                 └── Meta.tsx
└── pages
    ├── index.tsx
    └── todo
        └── [id]
            └── index.tsx
```

### _Core_ domain

We can refer to them as _**atoms**_, smallest building blocks, highly reusable and composable.
You can check the [Open UI](https://open-ui.org/components/card.research) standard proposal for inspiration how to split components into small segments. Components could be designed as [Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks) or Black-box Components with good ["inversion of control" interface](https://kentcdodds.com/blog/inversion-of-control) like [ReactSelect](https://react-select.com/components).

Here are some examples of core components:

<table>
  <tr>
    <th>Components</th>
    <th>Parts</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Card</td>
    <td>
      <code>Card</code>, <code>CardImage</code>, <code>CardImageOverlay</code>, <code>CardTitle</code>, <code>CardDescription</code>, ...
    </td>
    <td>
      From these parts, you'll be able to compose multiple more specific <b>molecules</b> like <code>ProductCard</code> or <code>UserCard</code>.
    </td>
  </tr>
  <tr>
    <td>Section</td>
    <td>
      <code>Section</code>, <code>SectionHeader</code>, <code>SectionBody</code>, ..
    </td>
    <td>
      This might have multiple background schemes like <code>dimmed</code>, <code>inverted</code>, <code>light</code>.
    </td>
  </tr>
  <tr>
    <td>Search</td>
    <td>
      <code>Search</code>, <code>SearchInput</code>, <code>SearchEmpty</code>, <code>SearchResults</code>, ...
    </td>
    <td>
      <code>Search</code> uses context to provide shared state to other parts.
      <code>SearchInput</code> renders input and it could be placed anywhere in the DOM structure (for example, in the page <code>Header</code>).
      <code>SearchEmpty</code> and <code>SearchResults</code> handles switching between states and showing the result.
    </td>
  </tr>
  <tr>
    <td>
      ReactSelect
    </td>
    <td>
      <code>ReactSelect</code>,<br>
      <code>./components/ClearIndicator</code>,<br>
      <code>./components/Control</code>, ...
    </td>
    <td>
     The list of custom components can be found <a href="https://react-select.com/components">here</a>
    </td>
  </tr>
</table>

### _Shared_ domain

We can refer to them as _**molecules**_. They are more specific components built out of _**atoms**_ (core components).
They could be shared between feature components and encapsulates some specific logic of an feature.

We can split them into three domains:

1. `UI` - higher order user interface components
2. `Entity` - UI representation of a data models
3. `Utility` - headless utility components

#### Shared _UI_ domain

Component name is always composed out of two parts `Context` + `Domain`, for example `InputField` where `Input` is context and `Field` is domain.

Here are some examples of feature domain names:

<table>
  <tr>
    <th>Domains</th>
    <th>Components</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>fields</code></td>
    <td><code>InputField</code>, <code>TextareaField</code></td>
    <td>
      Specific form fields prepared to be used with <a href="https://react-hook-form.com/">React Hook Form</a> library.
      Built out of multiple parts, for example <code>InputGroup</code>, <code>InputLeftElement</code>, <code>Input</code> form <a href="https://chakra-ui.com/docs/form/input#add-elements-inside-input">Chakra UI</a>
    </td>
  </tr>
  <tr>
    <td><code>overlays</code></td>
    <td><code>UnsupportedBrowserOverlay</code>, <code>BugsnagErrorOverlay</code></td>
    <td>Components that covers the whole page and prevents user to interact with the page in some degree.</td>
  </tr>
  <tr>
    <td><code>layouts</code></td>
    <td><code>MainLayout</code>, <code>AdminLayout</code></td>
    <td>Components that are shared across the pages and renders the application shell (navigation and footer)</td>
  </tr>
  <tr>
    <td><code>messages</code></td>
    <td><code>NoResultsMessage</code>, <code>EmptyListMessage</code>, <code>LoadingMessage</code>, <code>ErrorMessage</code></td>
    <td>Reusable messages components that could be shared across the pages for handling empty list results, loading states or ErrorBoundaries fallback</td>
  </tr>
  <tr>
    <td><code>navigations</code></td>
    <td><code>MainNavigation</code>, <code>AdminNavigation</code></td>
    <td>Different navigations used in layouts to support different app shell styles. They could handle user logged-in/logged-out states and mobile/desktop layouts</td>
  </tr>
  <tr>
    <td><code>footers</code></td>
    <td><code>MainFooter</code>, <code>AdminFooter</code></td>
    <td>Different footers used in layouts to support different app shell styles. Serves the same purpose as <code>navigations</code></td>
  </tr>
  <tr>
    <td><code>panels</code></td>
    <td><code>ArticlesPanel</code>, <code>EventPanel</code>, <code>EventSidebarPanel</code>, <code>GroupPanel</code></td>
    <td>
      Specific panels that holds filtering dropdowns for narrowing down the list results. Usually consists of core <code>Panel</code> compound component for sharing the styles and sorting dropdowns.
    </td>
  </tr>
  <tr>
    <td><code>markdowns</code></td>
    <td><code>ArticleMarkdown</code>, <code>AnnouncementMarkdown</code></td>
    <td>Components that handles parsing of the markdown and styling of the generated HTML</td>
  </tr>
  <tr>
    <td><code>icons</code></td>
    <td><code>PlusIcon</code>, <code>TrashIcon</code></td>
    <td>SVG icons used throughout the application. The icons should be named by what they are, not where they are used, e.g. <code>TrashIcon</code> instad of <code>DeleteIcon</code> or <code>ExclamationCircleIcon</code> instead of <code>ErrorIcon</code></td>
  </tr>
</table>

#### Shared _Entity_ domain

We can refer to them as _**molecules**_ also, but they are tied to some entity, for example Datx model, algolia resource, google map entity.

Component name is always composed out of two parts `Entity` + `Context`, for example `TodoList` where `Todo` is entity and `List` is context.

<table>
  <tr>
    <th>Domains</th>
    <th>Components</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>todo</code></td>
    <td><code>TodoList</code>, <code>TodoCreateForm</code>, <code>TodoCard</code>, ...</td>
    <td rowspan="3" style="max-width: 400px;">
      Primarily they should accept entity prop like this <code>&lt;UserCard user={user} /&gt;</code> where <code>user</code> is resource form the API, or in the rare occasions they could accept primitive props like <code>resourceId</code> and do the resource fetching via <code>SWR</code>.
    </td>
  </tr>
  <tr>
    <td><code>user</code></td>
    <td><code>UserList</code>, <code>UserCreateForm</code>, <code>UserCard</code>, ...</td>

  </tr>
  <tr>
    <td><code>ticket</code></td>
    <td><code>TicketList</code>, <code>TicketCreateForm</code>, <code>TicketCard</code>, ...</td>
  </tr>
</table>

#### Shared _utility_ domain

Utility components usually does not have any visual representation on the screen, but they are still reusable declarative components.

<table>
  <tr>
    <th>Domains</th>
    <th>Components</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>utilities</code></td>
    <td><code>Meta</code>,  <code>BugsnagErrorBoundary</code></td>
    <td>
     <code>Meta</code> inserts <code>meta</code> tags into document <code>head</code>. <code>BugsnagErrorBoundary</code> catches the error, triggers the Bugsnag report and render fallback component
    </td>
  </tr>
</table>

#### `components` folder

When adding a components folder, you are essentially breaking down larger main components into smaller, reusable chunks that are only relevant within that specific component.

Guidelines:

1. **Single Level Nesting**: Only one level of component nesting should be used inside the components folder to keep the structure simple and maintainable.
2. **Component Purpose**: These smaller components should not be reused outside their parent component.
3. **Naming Consideration**: To avoid confusion with the root components folder, consider renaming this folder to elements. This renaming helps differentiate between global components and component-specific elements.

Example:
For a MainTable component with a unique TableHeader, the structure should look like this:

```jsx
// src/components/features/MainTable/components/TableHeader.tsx
export const TableHeader: FC<FlexProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Flex align="center" p={20} {...props}>
      <Heading size="md" colorScheme="secondary" as="h3">
        {t("table.title")}
      </Heading>
      <Button leftIcon={<ArrowForwardIcon />} colorScheme="teal" variant="solid">
        {t("table.viewAll")}
      </Button>
    </Flex>
  );
};
```

Folder structure for this feature:

```
src
└── components
    └── features
        └── MainTable
            ├── components
            │   └── TableHeader.tsx
            └── MainTable.tsx
```

## Elements

If you have many style declarations inside your component file, making it difficult to read, create a separate file named `ComponentName.elements.ts` to store your custom styled components.

Example:

```
└── WelcomeCard
    ├── WelcomeCard.tsx
    └── WelcomeCard.elements.ts
```

**WelcomeCard.tsx:**

```js
import { chakra } from '@chakra-ui/react';

export const WelcomeCardLayout = chakra('div', {
	baseStyle: {
		padding: '16px',
		borderRadius: '8px',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
	},
});

export const WelcomeCardTitle = chakra('h1', {
	baseStyle: {
		fontSize: '24px',
		color: 'teal',
	},
});
```

**WelcomeCard.elements.ts:**

```js
import { chakra } from '@chakra-ui/react';

export const WelcomeCardLayout = chakra('div', {
	baseStyle: {
		padding: '16px',
		borderRadius: '8px',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
	},
});

export const WelcomeCardTitle = chakra('h1', {
	baseStyle: {
		fontSize: '24px',
		color: 'teal',
	},
});
```

Moving things to .elements.tsx should be the last step in the development process and it should only be used for organizational purposes, i.e., when the main component becomes cluttered and unreadable.

**Rules for Creating Elements:**

- Use `.elements.tsx` for organizational purposes only.
- Custom components in `.elements.tsx` should not be reused outside their root component.
- Combining chakra factory and functional components is allowed.
- Avoid using hooks inside elements.

> For more information check [Chakra UI - Style Props section](https://infinum.com/handbook/frontend/react/chakra-ui#style-props).

## Different component layouts for different screen sizes

In most of the cases we should strive to create responsive components that consist of one DOM structure that is going to be rendered on all screen sizes by utilizing CSS only solutions. Work closely with your designer to achieve this.

But, there are cases when we need to create different DOM structures for different screen sizes.

## Collocating different layouts in one component

With the help of Chakra UI [Display](https://chakra-ui.com/docs/styled-system/style-props#display) helper props:

```tsx
export const UserCard = (props) => {
	return (
		<Box {...props}>
			<Box hideFrom="md">// Mobile layout</Box>
			<Box hideBelow="md">// Desktop layout</Box>
		</Box>
	);
};
```

## Different component layouts for different screen sizes in separate `layout` components

In this case, inside a specific component, we could add a subfolder `layouts` (not to be confused with actual layout described below) to define how our component would look like on a specific media query. We recommend using this approach only for layouts that would add too much complexity when using Chakra UI [Display](https://chakra-ui.com/docs/styled-system/style-props#display) helper props. We realize that this approach usually results in a lot of code duplication, so use this approach only when necessary.

```
.
└── admin
    └── UserCard
        ├── layouts
        │   ├── UserCard.mobile.tsx
        │   └── UserCard.desktop.tsx
        └── UserCard.tsx
```

For this case, inside `UserCard.tsx` we would have something like this:

With help of Chakra UI [Display](https://chakra-ui.com/docs/styled-system/style-props#display) helper props:

```tsx
export const UserCardMobile = () => <Box hideFrom="md">// Mobile layout</Box>;

export const UserCardDesktop = () => <Box hideBelow="md">// Desktop layout</Box>;

export const UserCard = () => {
	return (
		<Fragment>
			<UserCardMobile />
			<UserCardDesktop />
		</Fragment>
	);
};
```

With help of Chakra UI [Show/Hide](https://chakra-ui.com/docs/components/show-hide):

```tsx
import { Show, Hide } from '@chakra-ui/react';

export const UserCard = () => {
	return (
		<Fragment>
			<Hide above="md">
				<UserCardMobile />
			</Hide>
			<Show above="md">
				<UserCardDesktop />
			</Show>
		</Fragment>
	);
};
```

> Use of [Show/Hide](https://chakra-ui.com/docs/components/show-hide) helpers is advisable to be used only for client side rendering. For server side rendering use [Display](https://chakra-ui.com/docs/styled-system/style-props#display) helper props.

### Extracting utility functions and hooks

Sometimes, you will have complex functions or effects inside your component that will affect the readability of your component.
In that case, you should extract them into separated files `*.utils.ts` and `*.hooks.ts`.

Main goal of these files is to store functions and hooks that are **specific for that component**, so we could keep our root `hooks` and `utils` folders clean and for global usage purposes only.

Example:

```
.
├── ...
└── AlbumsCarousel
    ├── AlbumsCarousel.tsx
    └── AlbumsCarousel.utils.ts
    └── AlbumsCarousel.hooks.ts
```

**Cluttered component**

```tsx
export const AlbumsCarousel = (props) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [highlighted, setHighlighted] = useState(null);
  const [zoom, setZoom] = useState(1);

  const modals = useModals();
  const carouselRef = useRef();

  const showLoginModal = () => {
    modals.open(Modals.Login);
  };

  const highlightAlbum = (id: number) => {
    setIsPlaying(false);
    setHighlighted(id);
    carouselRef.current.collapseItems();
  };

  const formatReleaseDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timezonedStart = new Date(start.valueOf() + start.getTimezoneOffset() * 60 * 1000);
    const timezonedEnd = new Date(end.valueOf() + end.getTimezoneOffset() * 60 * 1000);

    if (isSameDay(timezonedStart, timezonedEnd)) {
      return `${format(timezonedStart, 'd MMMM yyyy')}`;
    }

    if (!isSameYear(timezonedStart, timezonedEnd)) {
      return `${format(timezonedStart, 'd MMMM yyyy')} ${String.fromCharCode(8212)} ${format(
        timezonedEnd,
        'd MMMM yyyy',
      )}`;
    }

    if (!isSameMonth(timezonedStart, timezonedEnd)) {
      return `${format(timezonedStart, 'd MMMM')} ${String.fromCharCode(8212)} ${format(
        timezonedEnd,
        'd MMMM yyyy',
      )}`;
    }

    return `${format(timezonedStart, 'd')} ${String.fromCharCode(8212)} ${format(
      timezonedEnd,
      'd MMMM yyyy',
    )}`;
  }

  return (
    //...
    <div>{formatReleaseDate(props.startDate, props.endDate)</div>
    //...

  )
}
```

**Cleaned**

```tsx
import { formatReleaseDate } from './utils';

export const AlbumsCarousel = (props) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [highlighted, setHighlighted] = useState(null);
  const [zoom, setZoom] = useState(1);

  const modals = useModals();
  const carouselRef = useRef();

  const showLoginModal = () => {
    modals.open(Modals.Login);
  };

  const highlightAlbum = (id: number) => {
    setIsPlaying(false);
    setHighlighted(id);
    carouselRef.current.collapseItems();
  };

  return (
    //...
    <div>{formatReleaseDate(props.startDate, props.endDate)</div>
    //...
  )
}
```

### Layouts

With Layouts, we generally define overall page structure that will be presented to the user based on a specific auth state or a specific page.

For example, your app could have an Admin dashboard on `/admin` route which has a fixed header and sidebars on both right and left, and scrollable content in the middle (you're most likely familiar with this kind of layout).

You will define your different layouts inside `layouts` folder:

```
.
.
└── components
    └── shared
        └── layouts
            ├── AdminLayout
            │   └── AdminLayout.tsx
            ├── MainLayout
            │   └── MainLayout.tsx
            └── BlogLayout
                └── BlogLayout.tsx
```

Then, when creating your routes (pages), you will wrap your page in the layout that represents the current page:

```tsx
// pages/index.tsx

export default function Home() {
	return <MainLayout>...</MainLayout>;
}

// pages/admin.tsx
export default function Admin() {
	return <AdminLayout>...</AdminLayout>;
}
```

### Utility components

Utility components are headless, which means that they don't have any impact on the UI itself.
For example, Meta component for injecting meta tags inside document `<head>`.

Example:

```tsx
import React, { FC } from 'react';
import Head from 'next/head';

export const Meta: FC = () => {
	return (
		<Head>
			<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
			<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
			<link rel="shortcut icon" href="/favicon.ico" />
			<title>Infinum</title>
		</Head>
	);
};
```

```
src
.
└── components
    ├── shared
    │   ├── utilities
    │   │   └── Meta
    │   │       └── Meta.tsx
    ...
```

## Setting up the store

Your datx store and models will be placed in the root of the `src` folder as follows:

```
src
├── models
│   ├── User.ts
│   └── Session.ts
└── datx
    └── create-client.ts
```

## Fetchers

> This section is considered deprecated. For the newer approach check the [@datx/swr](https://datx.dev/docs/jsonapi-swr/overview) documentation.

In `src/fetchers` you will organize your (swr) fetchers, usually by the model on which you will make API calls.

```ts
// src/fetchers/user.ts

import { AppCollection } from '../store';
import { User } from '../models/User';

export async function fetchUser(store: AppCollection, id: string): Promise<User> {
	try {
		const response = await store.fetch(User, id, {
			include: ['albums'],
		});

		return response.data as User;
	} catch (response) {
		// handle response
	}
}
```

You will use your fetcher functions with `useSwr` hook inside of your components.

## Setting up theming and styles

When creating styles for your core components, you will create the `components` folder inside of the styles folder. The styles folder will contain all core stylings and the theme setup.

```
src
└── styles
    └── theme
        ├── index.ts # main theme endpoint
        ├── styles.ts # global styles
        ├── foundations # colors, typography, sizes...
        │   ├── font-sizes.ts
        │   └── colors.ts
        └── components # components styles
            └── button.ts
```

## Tests

When organizing test files, here are couple of quick rules:

- Components, utils, fetchers... should have a test file in the same folder where they are placed
- When testing pages, create the `__tests__/pages` folder because of how Next.js treats pages folder.
- All mocks should be placed in `__mocks__` folder

For other in depth guides for testing take a look at the [testing guide](https://infinum.com/handbook/frontend/react/testing-best-practices).

Folder structure would look something like this:

```
src
.
├── __mocks__
│   └── react-i18next.tsx
├── __tests__
│   ├── pages
│   │   └── user.test.ts
│   └── test-utils.tsx
├── pages
│   └── user.ts
├── fetchers
│   └── users
│       ├── users.ts
│       └── users.test.ts
└── components
    └── core
        └── Button
            ├── Button.test.tsx
            └── Button.tsx
```

## The complete structure

```
src
├── __mocks__
│   └── react-i18next.tsx
├── __tests__
│   ├── pages
│   │   └── user.test.ts
│   └── test-utils.tsx
├── components
│   ├── core
│   │   ├── Button
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.tsx
│   │   ├── Section
│   │   │   ├── Section.test.tsx
│   │   │   └── Section.tsx
│   │   └── Card
│   │       ├── Card.test.tsx
│   │       └── Card.tsx
│   ├── features
│   │   ├── home
│   │   │   ├── HomeHeaderSection
│   │   │   │   ├── HomeHeaderSection.test.tsx
│   │   │   │   └── HomeHeaderSection.tsx
│   │   │   └── HomeTodoListSection
│   │   │       ├── HomeTodoListSection.test.tsx
│   │   │       └── HomeTodoListSection.tsx
│   │   ├── album
│   │   │   └── AlbumsCarousel
│   │   │       ├── AlbumsCarousel.tsx
│   │   │       ├── AlbumsCarousel.test.ts
│   │   │       ├── AlbumsCarousel.utils.ts
│   │   │       └── AlbumsCarousel.hooks.ts
│   │   └── todo
│   │       ├── TodoHeaderSection
│   │       │   ├── TodoHeaderSection.test.tsx
│   │       │   └── TodoHeaderSection.tsx
│   │       └── TodoCreateFormSection
│   │           ├── TodoCreateFormSection.test.tsx
│   │           └── TodoCreateFormSection.tsx
│   └── shared
│       ├── layouts
│       │   ├── AdminLayout
│       │   │   └── AdminLayout.tsx
│       │   ├── MainLayout
│       │   │   └── MainLayout.tsx
│       │   └── BlogLayout
│       │       └── BlogLayout.tsx
│       ├── fields
│       │   └── TextField
│       │       ├── TextField.test.tsx
│       │       └── TextField.tsx
│       ├── cards
│       │   ├── UserCard
│       │   │   ├── layouts
│       │   │   │   ├── UserCard.mobile.tsx
│       │   │   │   └── UserCard.desktop.tsx
│       │   │   ├── UserCard.test.tsx
│       │   │   └── UserCard.tsx
│       │   └── WelcomeCard
│       │       ├── WelcomeCard.test.tsx
│       │       ├── WelcomeCard.elements.ts
│       │       └── WelcomeCard.tsx
│       ├── todo
│       │   ├── TodoCard
│       │   │   ├── TodoCard.test.tsx
│       │   │   └── TodoCard.tsx
│       │   ├── TodoList
│       │   │   ├── TodoList.test.tsx
│       │   │   └── TodoList.tsx
│       │   └── TodoCreateForm
│       │       ├── TodoCreateForm.test.tsx
│       │       └── TodoCreateForm.tsx
│       └── utilities
│             ├── BugsnagErrorBoundary
│             │   └── BugsnagErrorBoundary.tsx
│             └── Meta
│                 └── Meta.tsx
├── models
│   ├── User.ts
│   └── Session.ts
├── datx
│   └── create-client.ts
├── styles
│   └── theme
│       ├── index.ts
│       ├── styles.ts
│       ├── foundations
│       │   ├── font-sizes.ts
│       │   └── colors.ts
│       └── components
│           └── button.ts
└── pages
    ├── index.tsx
    └── todo
        └── [id]
            └── index.tsx
```

## App Router

By using the App Router, you gain more granular control over your layouts, data fetching, and code structure - yielding a cleaner, more scalable, and more performant application in the long run.

### Key Differences from the Pages Router

With the release of Next.js 13, the App Router introduces several new concepts that differ significantly from the Pages Router. Here are the key differences and benefits:

1. `app/` Directory
   - Replaces `pages/` as the main place for routing.
   - Allows colocation of files like `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, and more within each route segment.
   - Promotes splitting the application by `route/feature` instead of having a flat `pages/` structure.
2. Route Groups
   - Introduced to conceptually group routes without affecting the final URL (`(groupName)` folders).
   - Ideal for organizing large projects (e.g., `(authorization)`, `(admin)`, `(marketing)`).
3. Nested Layouts
   - Each folder in app/ can have a `layout.tsx` file that wraps all of its nested routes.
   - Eliminates the need for layout components in every page.
   - Example:
     - `app/(marketing)/layout.tsx` wraps all `(marketing)` pages like `dashboard` and `about`.
     - `app/(admin)/layout.tsx` applies only to admin pages.
4. Improved File Organization
   - You can colocate `_components`, `_hooks`, `_utils`, `_types`, etc. within each route directory.
   - Encourages a feature-driven, modular code structure instead of a strictly pages-driven one.
5. Server vs Client Components
   - By default, files in `app/` are Server Components, offering better performance and reduced bundle sizes.
   - You can opt into Client Components with `"use client"` directive when you need interactivity.
6. No more `getStaticProps` or `getServerSideProps`
   - Data fetching is now more flexible. You can fetch data directly in a Server Component (using standard `async/await`), or use RSC primitives like `fetch()`.
   - `layout.tsx` can also fetch data and pass it to child components as props.
7. API Routes in `app/api/`
   - Replaces `pages/api/` for route handlers.
   - Uses **Request** & **Response** objects instead of API handlers.
8. `loading.tsx` and `error.tsx` for Better UX
   - `loading.tsx` shows a skeleton loader while fetching data.
   - `error.tsx` catches errors for that route.
   - Works per-route or globally in `app/`.

**Why it's better**

1. More Flexible & Scalable
   - Nested layouts and route groups let you organize complex UIs in a way that was harder or more verbose in the Pages Router.
   - The file-system routing remains intuitive while providing new capabilities like colocation of components, hooks, and utilities.
2. Performance & Bundle Size
   - Server Components help keep initial payload sizes down by only shipping necessary code to the client.
   - Automatic code splitting ensures only essential bits are loaded per route.
3. Better Developer Experience
   - Colocation of related files (tests, types, hooks) simplifies discovering and maintaining logic.
   - The new data-fetching model (removing `getServerSideProps` and `getStaticProps`) feels more natural to React developers.
4. Incremental Adoption
   - You can run App Router and Pages Router in the same project if you are migrating gradually.
   - This means no big-bang rewrite, so you can adopt new features at your own pace.

### App Router structure

Below is an example of a complete App Router folder structure, similar to what you have in the Pages Router section, but adapted to Next.js 13 best practices. This structure follows the **Colocation** principle, which encourages grouping related files together within their respective feature or route directories. This approach improves maintainability, reduces unnecessary imports, and keeps the project modular. You can learn more about Colocation in the [Next.js documentation](https://nextjs.org/docs/app/getting-started/project-structure#colocation). Note that this example includes route groups like `(authorization)`, `(admin)`, and `(marketing)`, a `[locale]` directory for **i18n**, plus an `api` folder for route handlers:

```
src
├── app
│   ├── api                              // Server API endpoints (App Router)
│   │   ├── health                       // Example server endpoint: /api/health
│   │   │   └── route.ts
│   │   └── auth
│   │       └── [..nextauth]
│   │           └── route.ts            // NextAuth route
│   └── [locale]                         // Top-level for i18n (e.g. /en, /fr)
│       ├── layout.tsx                   // Root layout for everything under /[locale]
│       ├── _components                  // Shared "global" components
│       │   └── Button
│       │       ├── Button.tsx
│       │       └── Button.test.tsx
│       ├── _hooks                       // Shared "global" hooks
│       │   └── useResponsive
│       │       ├── useResponsive.ts
│       │       └── useResponsive.test.ts
│       ├── _types                       // Shared "global" types/interfaces
│       │   └── globalTypes.ts
│       ├── _utils                       // Shared "global" utils/helpers
│       |   └── fetchHelpers
│       |       ├── fetchHelpers.ts
│       |       └── fetchHelpers.test.ts
│       ├── (root)
|       |   ├── _components              // Components used only by the root page
|       |   └── page.tsx                 // Root page -> /[locale]
│       ├── (authorization)              // Route group for auth pages
│       │   ├── layout.tsx               // Optional layout for (authorization) routes
│       │   ├── login                    // /[locale]/login
│       │   │   ├── page.tsx
│       │   │   ├── _components
│       │   │   │   └── LoginForm
│       │   │   │       ├── LoginForm.tsx
│       │   │   │       ├── LoginForm.test.tsx
│       │   │   │       └── LoginForm.types.ts     // Types used by LoginForm (props interfaces, etc.)
│       │   │   ├── _hooks
│       │   │   │   └── useLogin
│       │   │   │       ├── useLogin.ts
│       │   │   │       ├── useLogin.test.ts
│       │   │   │       └── useLogin.types.ts      // Types used only by useLogin hook
│       │   │   ├── _types
│       │   │   │   └── loginTypes.ts              // Shared types across login page
│       │   │   └── _utils
│       │   │       └── loginHelpers
│       │   │           ├── loginHelpers.ts
│       │   │           └── loginHelpers.test.ts
│       │   └── signup                   // /[locale]/signup
│       │       ├── page.tsx
│       │       └── _components
│       │           └── SignupForm
│       │               ├── SignupForm.tsx
│       │               └── SignupForm.test.tsx
│       ├── (admin)                      // Route group for admin pages
│       │   ├── layout.tsx               // Optional layout for (admin) routes
│       │   └── users                    // /[locale]/users
│       │       ├── page.tsx
│       │       ├── _components
│       │       │   └── UsersList
│       │       │       ├── UsersList.tsx
│       │       │       └── UsersList.test.tsx
│       │       ├── _hooks
│       │       │   └── useUsersList
│       │       │       ├── useUsersList.ts
│       │       │       └── useUsersList.test.ts
│       │       ├── _types
│       │       │   └── usersTypes.ts
│       │       └── _utils
│       │           └── usersHelpers
│       │               ├── usersHelpers.ts
│       │               └── usersHelpers.test.ts
│       └── (marketing)                  // Route group for marketing pages
│           ├── layout.tsx               // Optional layout for (marketing) routes
│           ├── dashboard                // /[locale]/dashboard
│           │   ├── page.tsx
│           │   ├── _components
│           │   │   ├── DashboardHeader
│           │   │   │   ├── DashboardHeader.tsx
│           │   │   │   └── DashboardHeader.test.tsx
│           │   │   └── DashboardStats
│           │   │       ├── DashboardStats.tsx
│           │   │       └── DashboardStats.test.tsx
│           │   ├── _hooks
│           │   │   └── useDashboard
│           │   │       ├── useDashboardData.ts
│           │   │       └── useDashboardData.test.ts
│           │   ├── _types
│           │   │   └── dashboardTypes.ts
│           │   └── _utils
│           │       └── dashboardHelpers
│           │           ├── dashboardHelpers.ts
│           │           └── dashboardHelpers.test.ts
│           ├── about                    // /[locale]/about
│           │   └── page.tsx
│           └── contact                  // /[locale]/contact
│               └── page.tsx
├── assets                                // Folder for images, icons, or other static assets
│   └── images
│       └── example.png
├── lib                                   // External dependency config (CASL, Stripe, etc.)
│   ├── auth.ts
│   ├── casl.ts
│   └── stripe.ts
└── typings                               // Types for Module Augmentation
    ├── next-auth.d.ts
```

_Guides are not rules and should not be followed blindly. Use your head and think._

### Split components in smaller ones to increase reusability

Splitting components into smaller, single-responsibility components improves:

- Readability: Easier to understand and maintain each piece.
- Reusability: Smaller pieces can be reused across different parts of your application.
- Bundle Size: Potentially reduces bundle size via code splitting and tree-shaking.

```jsx
// BAD
const UserProfile = ({ user }) => (
	<div>
		<div>
			<img src={avatar} alt="User Avatar" />
			<h1>{name}</h1>
			<p>{bio}</p>
		</div>
		{user.posts.map((post) => (
			<p key={post.id}>{post.content}</p>
		))}
	</div>
);
```

```jsx
// GOOD
const UserProfileHeader = ({ avatar, name, bio }) => (
	<div>
		<img src={avatar} alt="User Avatar" />
		<h1>{name}</h1>
		<p>{bio}</p>
	</div>
);

const UserPosts = ({ posts }) => posts.map((post) => <p key={post.id}>{post.content}</p>);

const UserProfile = ({ user }) => (
	<div>
		<UserProfileHeader avatar={user.avatar} name={user.name} bio={user.bio} />
		<UserPosts posts={user.posts} />
	</div>
);
```

**Additional tips**

- Keep each component focused on a single task.
- Use composition over inheritance.
- Avoid massive components that do “everything.”

### Avoid Inline Functions and Objects

Defining functions or object literals inside the component render can trigger unnecessary re-renders because each render creates new references.

```jsx
// BAD
const MyComponent = () => {
	const handleClick = () => {
		console.log('Clicked');
	};

	return <button onClick={handleClick}>Click me</button>;
};
```

```jsx
// GOOD
const handleClick = () => {
	console.log('Clicked');
};

const MyComponent = () => <button onClick={handleClick}>Click me</button>;
```

**However**, if you need dynamic logic or closure over component state, you may define the function inside—but do so cautiously or use useCallback to memoize.

### Memoize Expensive Calculations

Use `useMemo` for expensive computations and `useCallback` for expensive or frequently re-created callbacks.

- `useMemo` returns a memoized value.
- `useCallback` returns a memoized callback function.

Only use them for **truly expensive operations** (e.g., large data transformations, heavy calculations). Overusing `useMemo/useCallback` can harm readability and performance.

```
// Suppose we have an expensive calculation
function calculateBigData(items) {
  // ...some heavy logic...
  return items.reduce(...);
}

const MyExpensiveComponent = ({ items, onSubmit }) => {
  const processedItems = useMemo(() => calculateBigData(items), [items]);

  const handleSubmit = useCallback(() => {
    // use processedItems
    onSubmit(processedItems);
  }, [processedItems, onSubmit]);

  return (
    <div>
      {/* Render processedItems */}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

### Avoid Prop Drilling

When you pass props through multiple levels of components, it's called prop drilling. This can make your code difficult to follow and maintain.

**Strategies to Fix Prop Drilling**

- Context API: Great for global or app-wide data (e.g., user session, theme).
- Custom Hooks: Encapsulate state logic in a hook that can be reused.
- State Management Libraries: If the app is large or has complex state, consider libraries like Redux, Zustand, etc.

**Example of using Context**

```
// themeContext.js
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{theme, setTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

// AnyChildComponent.js
import { useContext } from 'react';
import { ThemeContext } from './themeContext';

const AnyChildComponent = () => {
  const { theme } = useContext(ThemeContext);
  return <div className={theme}>I am themed!</div>;
};
```

### Use Error Boundaries

To gracefully handle JavaScript errors, use **Error Boundaries**. They catch errors in the component tree and can show a fallback UI.

```
// ErrorBoundary.js
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong!</h1>;
    }
    return this.props.children;
  }
}
```

### Keep Components Self-Contained

When possible, _colocate_ files related to a single component:

- Component File (MyComponent.tsx)
- Styles (MyComponent.styles.js or .module.css)
- Tests (MyComponent.test.ts)
- Types (MyComponent.types.ts if using TypeScript)

You can read more about _Organizing components_ in the [Project Structure chapter](/frontend/react/project-structure).

### Code Splitting and Lazy Loading

Use `React.lazy` and `Suspense` to split your code into chunks, loading them on demand. This speeds up initial load times.

```
const About = React.lazy(() => import('./About'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <About />
    </Suspense>
  );
}
```

### Optimize Rendering with `React.memo`

Use `React.memo` for functional components to skip re-render if props don't change.

```
const MyButton = React.memo(({ label, onClick }) => {
  console.log('Render MyButton');
  return <button onClick={onClick}>{label}</button>;
});
```

### Performance Profiling

React DevTools provides Profiler to analyze renders, re-renders, and component updates.

**Using the React Profiler**

1. Install React DevTools Extension
   - Chrome: React DevTools
   - Firefox: React DevTools
2. Enable Profiler
   - Open React DevTools in Chrome/Firefox DevTools (F12 → Components tab).
   - Click on Profiler and Start Recording.
   - Perform interactions (e.g., clicking buttons, navigating).
   - Stop recording and analyze render times.
3. Identify Expensive Renders
   - React highlights slow renders in red.
   - Look for components that render frequently without needing to.
4. Use Profiling API in Production

```
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={(id, phase, actualDuration) => {
    console.log(`${id} re-rendered during ${phase}, took ${actualDuration}ms`);
}}>
    <MyComponent />
</Profiler>
```

### Use Lazy Initialization in `useState`

Avoid expensive calculations on initial render.

```
const [bigArray] = useState(() => new Array(10000).fill("Item"));
```

### Use `next/image` for Automatic Optimization

The `<Image />` component automatically optimizes images on the server side.

- Converts `image.jpg` to an optimized format (e.g., `WebP`).
- Serves different sizes based on the device screen (DPR-based resizing).
- Uses built-in lazy loading to defer off-screen images.
- Caches and compresses images automatically.
- Gives the `priority` prop for critical images (logos, banners, hero images) that should load immediately.
- Gives the `placeholder` props that automatically generates blurred placeholders for slow-loading images.

| Feature           | <img> (HTML) | <Image /> (Next.js) |
| ----------------- | ------------ | ------------------- |
| Resizing          | No           | ✅ Yes              |
| Lazy Loading      | No           | ✅ Yes (default)    |
| Responsive Sizes  | No           | ✅ Yes              |
| Format Conversion | No           | ✅ Yes (WebP, AVIF) |
| Caching           | No           | ✅ Yes              |
| Placeholder Blur  | No           | ✅ Yes              |

```
// Mobile (<768px): Image takes 100% of viewport width.
// Tablet (768px - 1200px): Image takes 50% of viewport.
// Larger screens: Fixed at 800px.

<Image
  src="/large-image.jpg"
  width={800}
  height={400}
  alt="Large Image"
  priority // Has priority over other images
  placeholder="blur" // Renders blur placeholder
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
/>
```

**External images optimization**

By default, `<Image />` only optimizes local images (`/public` folder). To optimize external images (CDNs, APIs), configure `next.config.js`:

```
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/images/**",
      },
    ],
  },
};
```

**When to Use `<img>` Instead of `<Image />`**

| Use `<Image />` for:                       | Use `<img>` for:                                  |
| ------------------------------------------ | ------------------------------------------------- |
| Local images                               | Unoptimized external images                       |
| CDN-hosted images (with remotePatterns)    | Dynamic user-generated content (e.g., API images) |
| Images that must be responsive & optimized | Icons & simple inline images                      |

### Use Compound Components for Reusability

Instead of relying on props drilling, use _Compound Components_ to allow multiple related components to work together seamlessly.

```
const Tabs = ({ children }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  return React.Children.map(children, (child, index) =>
    React.cloneElement(child, { activeIndex, setActiveIndex, index })
  );
};

const TabList = ({ children, activeIndex, setActiveIndex }) => (
  <div>
    {React.Children.map(children, (child, index) =>
      React.cloneElement(child, { isActive: activeIndex === index, onClick: () => setActiveIndex(index) })
    )}
  </div>
);

const Tab = ({ children, isActive, onClick }) => (
  <button style={{ fontWeight: isActive ? "bold" : "normal" }} onClick={onClick}>
    {children}
  </button>
);

const TabPanels = ({ children, activeIndex }) => <div>{children[activeIndex]}</div>;

const TabPanel = ({ children }) => <div>{children}</div>;

// Usage
<Tabs>
  <TabList>
    <Tab>Tab 1</Tab>
    <Tab>Tab 2</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Content 1</TabPanel>
    <TabPanel>Content 2</TabPanel>
  </TabPanels>
</Tabs>;
```

### Use State Reducers

Instead of using multiple `useState` hooks, use a _state reducer_ pattern to consolidate state updates and avoid prop drilling.

```
const initialState = { count: 0 };

const reducer = (state, action) => {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
};

const Counter = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
    </div>
  );
};
```

### Optimize List Rendering with Virtualization

Rendering large lists (>1000 items) in React can cause performance issues. Use [TankStack Virtual](https://tanstack.com/virtual/latest) to optimize it.

**Why TanStack Virtual?**

- Efficient Rendering - Renders only visible elements instead of the entire list.
- Improved Performance - Reduces memory usage and re-renders, improving FPS and responsiveness.
- Highly Customizable - Works for lists, grids, infinite scrolling, and dynamic row heights.
- Lightweight & Framework-Agnostic - More flexible and performant than `react-window` or `react-virtualized`.

```
import { useVirtualizer } from "@tanstack/react-virtual";

const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

const VirtualizedList = () => {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div ref={parentRef}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} style={{ position: "absolute", top: virtualRow.start }}>
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;
```

### Use `useDeferredValue` for Smooth User Input

To reduce laggy UI updates, use useDeferredValue when dealing with search input or large state updates.

```
const Search = ({ query }) => {
  const deferredQuery = useDeferredValue(query); // Defer rendering heavy UI updates
  return <ExpensiveComponent data={filterData(deferredQuery)} />;
};
```

React Hooks were introduced in version 16.8.0 as function component counterpart of class component lifecycles.
For more information, see the official [React Hooks API Reference](https://react.dev/reference/react/hooks).

## Hooks flow

Before starting, it is important to understand the flow of react hooks.

Here is a diagram that explains it visually:

![hooks-flow](https://raw.githubusercontent.com/donavon/hook-flow/master/hook-flow.png)

_The most important thing here is to notice how the "Run Effects" phase is executed last._

Here is a code example that explains this flow:

```jsx
export const MyComponent: FC = () => {
  // 1. Run Lazy initializers (i.e. () => 0)
  const [state, setState] = useState(() => 0);

  const previousStateRef = useRef();

  useEffect(() => {
    // 3. Run effect
    previousStateRef.current = state;
  }); // no dependencies array, because we want this to be called on every render

  // 2. Render
  return (
    <>
      Prev: {previousStateRef.current ?? "undefined"}
      <br />
      Current: {state}
      <br />
      <button onClick={() => setState(1)}>Update</button>
    </>
  );
}
```

In the "Mount" phase you will see:

```jsx
Prev: undefined;
Current: 0;
```

This is because `useEffect` is called after the first render and because assigning a value to `ref` does not trigger a re-render - instead, the value is populated and waiting for the next update phase.

When `button` is clicked, React will trigger the `update` phase and the result will be:

```jsx
Prev: 0;
Current: 1;
```

You can try this example out in `codesandbox`:

<iframe src="https://codesandbox.io/embed/react-flow-example-8x30c?fontsize=14&hidenavigation=1&theme=dark"
  class="codesandbox"
  style="width:100%; max-width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden; box-shadow:rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;"
  title="react-flow-example"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

## Using hook dependency arrays in `useEffect`

Dependency arrays are a way to trigger hooks functions only when the dependencies change. React will keep the values generated by a hook stored in memory and then run it when a change of a dependency has occurred. This applies to all hooks that can have dependencies.

```jsx
export const MyComponent: FC = ({ numberProp, stringProps }) => {
  useEffect(() => {
    // Runs only when `numberProps` or `stringProp` changes
  }, [numberProp, stringProp])

  // ...
}
```

For non-primitive values like objects, arrays and functions, React will do a reference comparison using [Object.is()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is). This means that we must provide the same reference of `objectProp`, `arrayProp`, `functionProp` to `Child` on every re-render if we don't want to trigger `useEffect` every time. This can be achieved by extracting them outside of the component or wrapping them in `useMemo` or `useCallback`.
Check [Using Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#using_object.is) section on MDN for better understanding.

_Note: There is a [JavaScript Records & Tuples Proposal](https://github.com/tc39/proposal-record-tuple) which will invalidate above arguments and make things simpler._

```jsx
const Child: FC = ({ objectProp, arrayProp, functionProp }) => {
  useEffect(() => {
    // Runs only when `objectProp`, `arrayProp` or `functionProp` reference changes
  }, [objectProp, arrayProp, functionProp])

  return ...;
}

// BAD
const Parent: FC = () => {
  // here we could have some code unrelated to Child component that could trigger re-render of Parent

  return (
    <Child
      objectProp={{ a: 'a' }}
      arrayProp={['a']}
      functionProp={() => 'a'}
    />
    // some other components...
  );
}

// GOOD
const objectProp = { a: 'a' };
const arrayProp = ['a'];

const Parent: FC = () => {
  // here we could have some code unrelated to Child component that could trigger re-render of Parent

  const functionProp = useCallback(() => 'a', []);

  return (
    <Child
      objectProp={objectProp}
      arrayProp={arrayProp}
      functionProp={functionProp}
    />
    // some other components...
  );
}

// FUTURE with Records & Tuples
const Parent: FC = () => {
  const functionProp = useCallback(() => 'a', []);

  return (
    <Child
      objectProp={#{ a: 'a' }}
      arrayProp={#['a']}
      functionProp={functionProp}
    />
  );
}
```

Use an empty dependency array if you want a hook to fire only on initial render.

```jsx
export const MyComponent: FC = () => {
  useEffect(() => {
    // Runs only on initial render
  }, [])

  // ...
}
```

If you don't provide a dependency array at all, `useEffect` will be called on `mount` and on each `update`.
For example, this could be used for storing previous values or sending events to an analytics service on each state change.

```jsx
export const MyComponent: FC = () => {
  const [state, setState] = useState(() => 0);
  const prevRef = useRef();

  useEffect(() => {
    // runs on mount and on each update
    prevRef.current = state;
  })

  // ...
}
```

Useful links:

1. [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect)

## Avoid misusing hook dependencies

As all values and references are recreated on each render, if you use anything from inside the component scope, be sure to provide it as a dependency, even if you think that the dependency will never change.

For example, when a `useEffect` includes a prop or a value created inside the component's scope, you might be tempted to pass an empty array as a dependency to run it only on the initial render (trying to use it as you would `componentDidMount` in class components):

```jsx
// BAD
export const MyComponent: FC = () => {
  const [value, setValue] = useState();

  const updateState = () => {
    // Do something with `setValue`
  }

  useEffect(() => {
    updateState();
  }, [])

  // ...
}
```

```jsx
// BAD
export const MyComponent: FC = ({ handlerFunction }) => {
  useEffect(() => {
    handlerFunction();
  }, [])

  // ...
}
```

Or you might want to skip some of the dependencies that you think will not change:

```jsx
// BAD
const MyComponent: FC = () => {
  const [value, setValue] = useState(null);

  const doSomethingOnValueChange = () => {...}

  useEffect(() => {
    if (value) {
      doSomethingOnValueChange(numberProp);
    }
  }, [value]) // missing a dependency (`doSomethingOnValueChange`)

  // ...
}
```

While you might think that a value will never change, it is not guaranteed, and React could use a stale value or reference, which might introduce bugs that are hard to trace in the future.

If you are doing this, there is a good chance that you should rethink the implementation and you actually need an alternative approach.

## Derive new state from the previous state value, if possible

This way, you can avoid using state values as hook dependencies and causing additional re-renders.

```jsx
// BAD
const Counter: FC = ({ incrementBy = 1 }) => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount(count + incrementBy), [
    incrementBy,
    count,
  ])

  // ...
}
```

```jsx
// GOOD
const Counter: FC = ({ incrementBy = 1 }) => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount((previousCount) => previousCount + incrementBy), [incrementBy])

  // ...
}
```

## Using lazy initialization when setting initial state with functions

If you are setting state with a function call, use lazy initialization and wrap it in an arrow function. This way you ensure that the function will be invoked only on first render:

```jsx
// BAD
const [id, setId] = useState(generateId());
```

```jsx
// GOOD
const [id, setId] = useState(() => generateId());
```

## If the initial state is undefined, specify the state type:

```jsx
// BAD
const [text, setText] = useState();
```

```jsx
// GOOD
const [text, setText] = useState<string>();
```

## Declare functions outside of the component, when they don't use anything from component scope (if you need to optimize rendering)

```jsx
const onButtonClick = (e: SyntheticEvent<HTMLButtonElement>) => {
  // This event handler is using only DOM's `event`
}

const Button: FC = () => {
  // ...
}
```

```jsx
const changeDocumentTitle = (title) => {
  document.title = title;
}

const App: FC = () => {
  // ...
}
```

## Add event listeners in `useEffect`

If you need to add event listeners from component scope, you can do it inside `useEffect`. Don't forget to cleanup in the return statement, which will execute before component is unmounted.

```jsx
const App: FC = () => {
  useEffect(() => {
    const handler = () => ...;

    document.addEventListener('fullscreenchange', handler);

    return () => {
      document.removeEventListener('fullscreenchange', handler);
    }
  }, []);

  // ...
}
```

_Note: `cleanup` is always a function._

## Wrap values derived from expensive calculations with `useMemo`

If you are using an expensive calculation to assign a value and it is causing slower performance, you can utilize `useMemo` to trigger that calculation only when necessary.

```jsx
// BAD
export const MyComponent: FC = ({ propA, propB }) => {
  const value = someExpensiveCalculation(propA, propB);

  // ...
}
```

```jsx
// GOOD
export const MyComponent: FC = ({ propA, propB }) => {
  const memoizedValue = useMemo(() => someExpensiveCalculation(propA, propB), [propA, propB]);

  // ...
}
```

## Defer creation of non-primitive values if you are using them within a dependency array

Since objects will be recreated on each render, they will also have a different reference every time - and `useEffect` will treat it as a changed dependency.

```jsx
// BAD
export const MyComponent: FC = ({ propA, propB }) => {
  const shape = {
    a: propA,
    b: propB,
  };

  useEffect(() => {
    /**
     * On each render, `useEffect` is causing an additional re-render,
     * since it's dependency is an object with a new reference every time.
     */
    doSomeSideEffectsWithShape(shape);
  }, [shape])

  // ...
}
```

Assuming that `propA` and `propB` are primitive (or memoized, non-primitive) values, with `useMemo` you are ensuring that non-primitive references are retained throughout re-renders, until `propA` or `propB` have changed.

```jsx
export const MyComponent: FC = ({ propA, propB }) => {
  useEffect(() => {
    // Triggers re-renders only if propA and propB have changed
    const shape = {
      a: propA,
      b: propB,
    };

    doSomeSideEffectsWithShape(shape);
  }, [propA, propB])

  // ...
}
```

## Wrap non-primitive values with useMemo, if you are sending them as props

You can use `useMemo` if you need to pass an non-primitive value as a prop to a component and you know it will cause a large subtree to re-render each time it changes:

```jsx
export const MyDataChartWithIntersection: FC = ({ xAxisData, yAxisData }) => {
  // getChartData is expensive calculation
  const data = useMemo(() => getChartData(xAxisData, yAxisData), [xAxisData, yAxisData]);

  // getIntersections is expensive calculation
  const intersection = useMemo(() => getIntersections(xAxisData, yAxisData), [xAxisData, yAxisData])

  return (
    <Chart data={data} intersection={intersection}/>
  );
}
```

## Do not use `useMemo` as a semantic guarantee that it will be a constant throughout component re-renders

If you need a value to stay the same throughout re-renders, you might think of `useMemo` as a nice way to "mimic" a constant. While it might seem that way, [it is not guaranteed](https://react.dev/reference/react/useMemo).

> **You may rely on useMemo as a performance optimization, not as a semantic guarantee.** In the future, React may choose to “forget” some previously memoized values and recalculate them on next render, e.g. to free memory for off-screen components. Write your code so that it still works without useMemo — and then add it to optimize performance when it's necessary.

To see what the alternatives are, check out the [keeping consistent values trough rerenders](recipes/keeping-consistent-values-trough-rerenders) recipe.

## Two-pass rendering

If you intentionally need to render something different on the server or on the client, you can do a two-pass rendering. Components that render something different on the client can read a state variable like `isClient`, which you can set to true in `useEffect` (since `useEffect` only runs on the client). This way the initial render pass will render the same content as the server, avoiding mismatches, but an additional pass will happen synchronously right after hydration. Note that this approach will make your components slower because they have to render twice, so use it with caution.

Remember to be mindful of user experience on slow connections. The JavaScript code may load significantly later than the initial HTML render, so if you render something different in the client-only pass, the transition can be jarring. However, if executed well, it may be beneficial to render a “shell” of the application on the server, and only show some of the extra widgets on the client. To learn how to do this without getting the markup mismatch issues, refer to the explanation in the [imperative update](recipes/imperative-update) recipe.

```jsx
const useIsClient = () => {
  const [isClient, setClient] = useState(false);

  useEffect(() => {
    setClient(true)
  }, []);

  return isClient;
}

export const Component: FC = () => {
  const isClient = useIsClient();

  return <div>{isClient ? 'Client' : 'Server'}</div>
}
```

## Wrap functions with `useCallback` if they can cause large subtrees to re-render too often

While it is mostly unnecessary to wrap functions with `useCallback`, since the memoization process will usually be as expensive or more, it can be useful if functions' dependencies change often or if they are passed down to a large subtree of children.

```jsx
// In this case, memoization is probably not worth it, since it will not necessarily improve performance
export const MyButton: FC = () => {
  const onClick = useCallback((e: SyntheticEvent<HTMLButtonElement>) => {
    ...
  }, [])

  return (
    <Button onClick={onClick} />
  );
}
```

```jsx
// Here, memoization is probably useful, because `onClick` will stay the same if other state changes re-render the component, and will not trigger a large subtree to re-render unnecessarily
export const MyList: FC = () => {
  // ...

  const onListItemClick = useCallback(() => {
    ...
  }, [...])

  return <LargeList onListItemClick={onListItemClick} />;
}
```

## You don't have to avoid "inlining" non-expensive functions

React is good at optimizing, so if you prematurely decide to wrap a function inside a `useCallback`, often you will end up with slower performance. This is because memoization is expensive. In most cases, even if you improve performance, it will be an insignificant gain compared to simple and maintainable code you had before.

```jsx
export const StepButton: FC = ({ onClick, stepSize }) => {
  /**
   * You don't have to optimise (wrap in useCallback) because onClick and stepSize
   * are the same on each render and React can optimise this by itself.
   */
  return <button onClick={() => onClick(stepSize)}>Increment for {stepSize}</button>;
}

// GOOD
export const MyComponent: FC = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback((stepSize) => { setCount((previousCount) => previousCount + stepSize) }, []);

  return (
    <div>
      <div>Count {count}</div>
      <StepButton onClick={increment} stepSize={2} />
    </div>
  );
}
```

## Hooks encapsulation

A common problem with hooks is that the components using them can go out of control and become unreadable and messy.
This happens if you have multiple invocations of `useEffect` and `useCallback` in your function component body, which happens often if you are building real world products. To overcome this problem we can do the same thing as we would do in class components - split things into smaller chunks of logic and extract them, i.e. private methods of class components or custom hooks in function components.

The Problem:

This is a continuation of the previous section, but we will expand on it with some additional requirements.
We need to add an input field for setting the description of the value that we are counting, with decrement and reset handlers for the counter.

This is the previous code:

```jsx
export const MyComponent: FC = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback((stepSize) => { setCount((previousCount) => previousCount + stepSize) }, []);

  return (
    <div>
      <div>Count {count}</div>
      <StepButton onClick={increment} stepSize={2} />
    </div>
  );
}
```

This is the updated code with additional features.

```jsx
export const MyComponent: FC = () => {
  const [count, setCount] = useState(0);
  const [inputState, setInputState] = useState('')

  const increment = useCallback((stepSize) => { setCount((previousCount) => previousCount + stepSize) }, []);
  const decrement = useCallback((stepSize) => { setCount((previousCount) => previousCount + stepSize) }, []);
  const reset = useCallback(() => { setCount(0) }, []);

  const handleInputChange = useCallback(e => {
    setInputState(e.target.value);
  }, []);

  return (
    <div>
      <div>
        <label htmlFor="entity">Entity</label>
        <input
          type="text"
          id="entity"
          onChange={handleInputChange}
          value={inputState}
        />
      </div>
      <div>Count {count}</div>
      <StepButton onClick={increment} stepSize={2} />
      <StepButton onClick={decrement} stepSize={-2} />
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

You can see that our component becomes messy and hard to understand. There is a lot of code in the body of the function which increases our [cognitive load](https://en.wikipedia.org/wiki/Cognitive_load). To fix this issue we can **encapsulate** our **elements of concern** into a separate _chunks of work_, i.e. custom hooks.

The Solution:

```jsx
const useCount = (initialState = 0) => {
	const [state, setState] = useState(() => initialState);

	const handlers = useMemo(
		() => ({
			increment: (stepSize = 1) => {
				setState((previousCount) => previousCount + stepSize);
			},
			decrement: (stepSize = -1) => {
				setState((previousCount) => previousCount + stepSize);
			},
			reset: () => {
				setState(0);
			},
		}),
		[]
	);

	return [state, handlers];
};

const useInput = (initialState = '') => {
	const [state, setState] = useState(() => initialState);

	const handlers = useMemo(
		() => ({
			handleInputChange: (event) => {
				setState(event.target.value);
			},
		}),
		[]
	);

	return [state, handlers];
};

export const MyComponent = () => {
	const [count, { increment, decrement, reset }] = useCount();
	const [inputState, { handleInputChange }] = useInput();

	return (
		<div>
			<div>
				<label htmlFor="entity">Entity</label>
				<input type="text" id="entity" onChange={handleInputChange} value={inputState} />
			</div>
			<div>Count {count}</div>
			<StepButton onClick={increment} stepSize={2} />
			<StepButton onClick={decrement} stepSize={-2} />
			<button onClick={reset}>Reset</button>
		</div>
	);
};
```

Useful links:

1. [useEncapsulation or Why Your React Components Should Only Use Custom Hooks](https://kyleshevlin.com/use-encapsulation)
2. [Encapsulation or the Primary Purpose of Functions](https://kyleshevlin.com/encapsulation)

## Before you use memoization

Have in mind that React is really good at optimizing re-renders by default.

You might get tempted to wrap values and functions with `useMemo` and `useCallback` all the time, but in many of these cases, you don't really need it, and you might even make your app performance and file size worse. These calculations can be expensive and you could end up using more memory than you would without them and make your code more complicated to read and maintain.

If it's not obvious that memoization is needed, profile your app performance without it first, using [React Devtools](https://react.dev/learn/react-developer-tools), and then optimize if necessary.

![React Devtools Profiler](/img/react-hooks/profiler.png)

<div style="margin:0 auto; max-width:550px;">
  <blockquote class="twitter-tweet">
    <p lang="en" dir="ltr">
      ⚛️🛠 Prototype of a new Profiler feature, &quot;Scheduled by&quot;, enumerating which fibers triggered the current commit (which ones called set state).<br><br>Would this be useful? Could it be more useful? <a href="https://t.co/7AvVHB0wPY">pic.twitter.com/7AvVHB0wPY</a>
    </p>&mdash; Brian Vaughn 🖤 (@brian_d_vaughn) <a href="https://twitter.com/brian_d_vaughn/status/1126950967201546240?ref_src=twsrc%5Etfw">May 10, 2019</a>
  </blockquote>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>

<br/>

If you want to dive deeper here are some useful articles:

1. [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
2. [One simple trick to optimize React re-renders](https://kentcdodds.com/blog/optimize-react-re-renders)
3. [Profile a React App for Performance](https://kentcdodds.com/blog/profile-a-react-app-for-performance)
4. [React Production Performance Monitoring](https://kentcdodds.com/blog/react-production-performance-monitoring)

## Introduction

Caching is essential for building performant, reliable, and scalable applications. In the world of modern web development, being able to store and retrieve data efficiently can often mean the difference between a seamless user experience and a sluggish one. With Next.js’s new _App Router_ and _React Server Components_, the way we approach caching and revalidation has evolved. The ability to fetch data on the server, cache it strategically, and revalidate content automatically (or _on-demand_) provides developers with powerful tools to keep apps both fast and up-to-date.

This chapter aims to:

- Provide basic knowledge about caching.
- Explain advanced caching and revalidation strategies.
- Cover the various methods of caching (browser, HTTP, in-memory, edge).
- Dive into revalidation (ISR, on-demand revalidation, fallback strategies, and more).
- Include recipes and code snippets to get you started quickly.
- Offer tips, best practices, and pitfalls to watch out for.

## Refresh on fundamentals

Before diving into caching, let’s quickly refresh on how Next.js’s App Router and _React Server Components_ (_RSC_) work together. Understanding these fundamentals sets the stage for how we’ll discuss caching in Next.js and how we can best leverage these new features to build more performant applications.

### App Router

- The App Router was introduced in Next.js 13 to provide a more flexible and modular approach to routing.
- Routes are now organized under the `app/` directory instead of the traditional `pages/` directory.
- Each folder in the `app/` directory can contain a layout (`layout.tsx`), a page component (`page.tsx`), and a route handler (`route.ts`), among others - You can read more about structuring your project in the [Project Structure chapter](/frontend/react/project-structure).

### React Server Components

- _React Server Components_ allow you to fetch data and render components on the server, sending the rendered result to the client.
- The big advantage of _RSC_ is that it can reduce the client-side JavaScript bundle size and improve performance, as server-rendered content doesn’t need to bundle all logic for fetching data on the client.

### Data Layer & Caching implications

- Server Components fetch data on the server, which means you can apply server-side caching strategies (like in-memory caches, Redis, edge caching, etc.) more conveniently.
- Because the server is in control, you can also easily manage authentication, environment variables, secrets, and other sensitive data.

## Why do we even cache?

1. Performance
   - Reduces latency and speeds up data retrieval.
   - Minimizes repeated expensive operations (e.g., database queries, external API calls).
2. Scalability
   - Offloads frequent read operations from your databases or APIs.
   - Helps maintain consistent performance under high load.
3. Costs
   - Lower usage of third-party APIs or databases can reduce your operational costs.
   - Minimizing network overhead reduces cloud hosting fees in some scenarios.
4. User Experience
   - Decreases [Time to first byte (TTFB)](https://developer.mozilla.org/en-US/docs/Glossary/Time_to_first_byte).
   - Improves perceived performance and user satisfaction.

## Types of Caching

Caching isn’t a one-size-fits-all concept. The appropriate caching mechanism depends on:

- The type of data you’re fetching (static vs. dynamic).
- The frequency of data updates.
- Your infrastructure (CDN, serverless functions, etc.).
- Your operational constraints (cost, complexity, etc.).

We also have multiple different types of caching, each with it's own strategies:

- Web & Network Caching (Browser, HTTP, DNS).
- Application-Level Caching (In-Memory, Page).
- Database Caching (Query, Index, Row / Record).
- Hardware & System Caching (CPU, Disk, I/O).
- Distributed & Cloud Caching (Edge, Redis).
- Specialized Caching (Streaming, Compiler, Games).

Below are the major caching strategies you’ll likely encounter.

### Browser Caching

Browser caching is the simplest form of caching:

- 📌 Primarily controlled via `Cache-Control`, `ETag`, and [other HTTP headers](https://dev.to/andreasbergstrom/understanding-cache-control-and-etag-for-efficient-web-caching-2nf5) sent by the server.
- 📌 Helps reduce repeated downloads of static assets (images, CSS, JavaScript).
- ✅ Straightforward, no server involvement once the client has the resource.
- ⚠️ Can’t effectively manage dynamic content changes (short of forcibly invalidating the cache).

### HTTP Caching (CDNs & Proxies)

Content Delivery Networks (e.g. [AWS Cloudfront](https://aws.amazon.com/cloudfront/)) and reverse proxies (e.g. [Nginx](https://nginx.org/en/)) intercept requests and serve cached content:

- 📌 Highly efficient for static assets, also for certain dynamic content if configured well.
- 📌 Next.js on Vercel automatically integrates with edge caching for pages (especially in static generation scenarios).
- ✅ Gives massive performance gains for global users.
- ✅ Offloads traffic from your origin server.
- ⚠️ Requires advanced setup for dynamic, user-specific data can be complex.
- ⚠️ Might introduce cache invalidation complexities (stale data, etc.).

### Next.js In-Memory Caching

When fetching data in React Server Components, Next.js offers a built-in caching mechanism. You can leverage this by using the built-in `fetch` function’s caching options.

- ✅ Fully integrated with Next.js’ revalidation flow (_ISR_).
- ✅ Minimal configuration for typical use cases.
- ⚠️ Not suitable for large amounts of data or data with immediate real-time requirements.
- ⚠️ For advanced scenarios, you may need a dedicated caching solution (like [Redis](https://redis.io/)).

### Edge Caching

Edge caching is caching content at the network’s edge, physically closer to the user:

- 📌 Reduces [round-trip time (RTT)](https://aws.amazon.com/what-is/rtt-in-networking/).
- 📌 Allows for [geographical load balancing](https://www.vmware.com/topics/load-balancing#:~:text=Geographic%20%E2%80%94%20Geographic%20load%20balancing%20redistributes,data%20centers%20in%20many%20locations.).
- 📌 On Vercel, _Static Site Generation_ pages are cached globally at edge locations. When using _Incremental Static Regeneration_, outdated pages are invalidated and [regenerated in the background](https://vercel.com/docs/incremental-static-regeneration/quickstart#background-revalidation).
- ✅ Speed improvements for global users.
- ✅ Integrates seamlessly with Next.js.
- ⚠️ Some advanced dynamic use cases might require custom logic for invalidating or bypassing the cache.

## Data Fetching

When calling `fetch`, you can specify caching and revalidation behavior by using the standard cache values and Next.js-specific `next.revalidate`:

```jsx
const data = await fetch('https://api.example.com/data', {
	cache: 'force-cache', // or "no-store", "default", "reload", etc.
	next: { revalidate: 60 }, // revalidate after 60s
});
```

**Cache options**

- `default`
  Use the browser/Next.js default caching rules. Typically behaves like `no-cache` for cross-origin requests but can vary depending on context.

- `no-store`
  Do not read from or write to any caches. Always fetches fresh data on every request.

- `reload`
  Force the fetch to go to the network, bypassing any caches. The response can still be stored in the cache for subsequent requests if other settings allow it.

- `no-cache`
  The browser (and Next.js) will always validate the response with the server (using ETag, Last-Modified, etc.). If the resource has not changed, it may be served from a previously stored cache.

- `force-cache`
  Enforce retrieving the data from the Next.js (or browser) cache if available, or fetch it from the network and then cache it. Subsequent requests may be served from the cache if still valid.

- `only-if-cached`
  Return the response from the cache if it exists; otherwise, throw an error (typically a `504`). This mode is often restricted by browsers to same-origin requests.

**Next revalidate**

Tells Next.js how long to keep the cached version before revalidating in the background. This controls server-side caching behavior.

## Revalidation

Revalidation is the process of invalidating stale content and serving an up-to-date version without incurring the full cost of re-rendering on every request. Next.js provides multiple ways to handle revalidation, each suited to different scenarios.

### Incremental Static Regeneration (ISR)

_ISR_ allows you to generate static pages at build time and then revalidate them incrementally when they’re requested again. Here’s a brief flow:

1. User requests a page that is statically generated and cached at build time.
2. The page is served from the cache until the revalidate time window passes.
3. After the revalidate period, the next incoming request triggers Next.js to regenerate the page in the background.

In the App Router, you can configure ISR using `fetch` options or [metadata](#route-segment-config) in your route.

```jsx
export default async function ProductsPage() {
  const products = await fetch("https://api.example.com/products", {
    cache: "force-cache",
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  }).then((res) => res.json());

  return (
    <div>
      <h1>Our Products</h1>
      <ul>
        {products.map((product: { id: number; name: string }) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Route Segment Config

In Next.js, route metadata provides configuration options that can define how routes behave, including caching, revalidation, and rendering strategies. These options are defined as static exports within a route file, and they enable developers to easily configure settings like `revalidate`, `dynamic`, and more.

You can learn more about different segment options in the [Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).

### On-Demand Revalidation

_On-Demand Revalidation_ lets you invalidate cached pages or data immediately rather than waiting for the revalidate window. This is usually triggered by some external event - for example when a CMS entry is updated. You can have multiple route handlers in `app/api/...` directories, and each handler can handle revalidation for different paths or even multiple paths. For example, you can:

- Revalidate an entire blog section: `/blog/\*`.
- Revalidate a specific path: `/blog/my-post`.
- Revalidate by tags (useful if you have logical groupings of pages).

This way of revalidation ensures your site can be kept up-to-date in near real time, and is great for content-heavy sites with frequent updates.

You can find an example of API handler that revalidates tags sent in search params [later in this article](#complex-revalidation-route-handler-with-secret-key-guard), with some modifications this can be used as a Webhook triggered by CMS when the content changes.

### Fallback Strategies

When regenerating pages, Next.js will serve either:

- The stale page until the new version is ready ([stale-while-revalidate](https://nextjs.org/docs/app/building-your-application/caching#time-based-revalidation:~:text=This%20is%20similar%20to%20stale%2Dwhile%2Drevalidate%20behavior.)).
- A loading or error state if the data is crucial to load.

You can control these states via the new `loading.tsx` and `error.tsx` files in the App Router. This approach keeps the user experience seamless, even if the data is being re-fetched in the background.

## Recipes & Code Snippets

### Caching with `fetch`

[Fetch](https://nextjs.org/docs/app/api-reference/functions/fetch) data from an external API and cache it for 5 minutes, then [revalidate](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate).

```jsx
// app/(dashboard)/page.tsx

type DashboardData = {
  totalUsers: number;
  onlineUsers: number;
};

export default async function Dashboard() {
  // Revalidate after 5 minutes (300 seconds)
  const data = await fetch("https://api.example.com/dashboard", {
    next: { revalidate: 300 },
  }).then((res) => res.json() as Promise<DashboardData>);

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Total Users: {data.totalUsers}</p>
      <p>Online Users: {data.onlineUsers}</p>
    </section>
  );
}
```

### Mutate then Revalidate

Show an up-to-date list of items after a user adds a new item.

**Step 1: Create the Page**

```jsx
// app/items/page.tsx
import { ItemsList } from './_components/ItemsList';
import { ItemsForm } from './_components/ItemsForm';

export default function ItemsPage() {
	return (
		<div>
			<ItemsForm />
			<ItemsList />
		</div>
	);
}

export const dynamic = 'force-dynamic';
```

`ItemsPage` is a Server Component that brings together:

- `ItemsForm`, a Client Component for adding items.
- `ItemsList`, a Server Component for displaying the items.

[`force-dynamic`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic) forces a page or layout to be dynamically rendered for each user at request time

**Step 2: Create a Server Action**

```jsx
// app/actions/revalidateItems.ts
'use server';

import { revalidatePath } from 'next/cache';

// Revalidates the `/items` route to ensure fresh data
export async function revalidateItems() {
	revalidatePath('/items');
}
```

This [Server Action](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) manually triggers revalidation of the `/items` page. It forces Next.js to refresh all data for that route, including the `ItemsList` component.

**Step 3: Create the ItemsList component**

```jsx
// app/items/_components/ItemsList.tsx
export async function ItemsList() {
  const data = await fetch("http://localhost:3000/api/items", {
    next: {
      revalidate: 60,
    },
  }).then((res) => res.json());

  return (
    <ul>
      {data.items.map((item: string, idx: number) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}
```

This component fetches data from the API and displays the list of items.

[`next.revalidate: 60`](https://nextjs.org/docs/app/building-your-application/caching#fetch-optionsnextrevalidate) caches the response for 60 seconds. This means:

- If a user refreshes the page within 60 seconds, they see the cached data.
- After 60 seconds, the cache expires, and a new request is made.
- When `revalidateItems()` is called, it forces the `/items` route to refresh its data immediately, bypassing the cache.

**Step 4: Create the ItemsForm component**

```jsx
// app/items/_components/ItemsForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { revalidateItems } from '../../actions/revalidateItems'; // Import revalidateItems action

export function ItemsForm() {
	const [newItem, setNewItem] = useState('');
	const [shouldRevalidate, setShouldRevalidate] = useState(true);
	const [isPending, startTransition] = useTransition();

	const handleAddItem = async () => {
		await fetch('/api/items', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ newItem }),
		});

		setNewItem(''); // Clear the input field

		// Conditionally trigger revalidation and refresh
		if (shouldRevalidate) {
			startTransition(() => {
				revalidateItems(); // Manually revalidate the `/items` route
			});
		}
	};

	return (
		<div>
			<input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
			<button onClick={handleAddItem} disabled={isPending}>
				{isPending ? 'Adding...' : 'Add Item'}
			</button>

			<div>
				<label>
					<input type="checkbox" checked={shouldRevalidate} onChange={(e) => setShouldRevalidate(e.target.checked)} />
					Revalidate items after adding
				</label>
			</div>
		</div>
	);
}
```

- This component handles state (`useState`) and asynchronous actions ([`useTransition`](https://react.dev/reference/react/useTransition)).
- The checkbox (`shouldRevalidate`) determines whether the `/items` route should be revalidated after a new item is added.
- If the checkbox is checked, `revalidateItems()` is called to refresh the `/items` route immediately.
- `startTransition` allows React to prioritize UI updates (like clearing the input field) while handling revalidation in the background without blocking.

**Step 5: Create `/api/items/` [route handler](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)**

```jsx
// app/api/items.ts
import { NextResponse } from "next/server";

const items: string[] = ["Item A", "Item B"]; // Temporary in-memory storage

export async function GET() {
  return NextResponse.json({ items });
}

// Revalidate inside API route after modifying data
export async function POST(request: Request) {
  const { newItem } = await request.json();
  items.push(newItem);

  return NextResponse.json({ success: true });
}
```

**Step 6: Testing Cache Behavior**

1. Open Two Browser Windows
   - Open the `ItemsPage` in two separate browser windows or tabs.
2. Add a New Item in the First Window
   - Enter a new item in the input field and click "_Add Item_"
   - If the checkbox is checked:
     - The `revalidateItems()` action is triggered, clearing the cache for `/items`.
     - `startTransition()` ensures that `ItemsList` re-renders automatically in the first window to show fresh data.
   - If the checkbox is unchecked:
     - The API route updates the data, but no revalidation occurs. Both windows continue showing cached data until the cache expires (e.g., 60 seconds).
3. Check the Second Window
   - After adding an item in the first window:
     - The second window does not automatically update because it does not share the same React tree as the first window.
     - Manually refreshing the second window fetches fresh data because the cache has been invalidated.
4. Wait for Cache Expiration
   - If no revalidation is triggered, both windows will continue showing stale data until the cache expires based on `next.revalidate`.

**How It All Works Together**

In this setup, the `ItemsForm` component handles adding new items and optionally revalidating the `/items` route. Here's why this approach functions effectively:

1. Server Action for Revalidation:
   - The `revalidateItems()` function is a server action that calls `revalidatePath("/items")`, invalidating the cache for the `/items` page.
2. Client-Side Interaction:
   - When a new item is added via the form, the `handleAddItem()` function sends a `POST` request to the `/api/items` endpoint to add the item.
   - If `shouldRevalidate` is true, `startTransition()` is used to call `revalidateItems()`.
3. Automatic React Tree Refresh:
   - Calling `revalidateItems()` within `startTransition()` informs React that a low-priority update is occurring, prompting it to re-render components in current React tree.
   - This mechanism ensures that the `ItemsList` component fetches the updated data without requiring an explicit call to `router.refresh()`.
   - The second window does not automatically update because it does not share the same React tree as the first window.

**Why this is just a demonstration**

1. Revalidating in the Server Action is not the best practice:
   - In production, revalidating in the API route (e.g. in the `POST` handler) is the preferred approach. This centralizes cache invalidation with the data mutation.
   - If revalidation is part of the API logic, any client (not just React components) calling the API benefits from consistent behavior.
2. Server Actions Are Useful for Tight Integration:
   - Revalidating in a Server Action (`revalidateItems()`) works well when the mutation and the affected React tree are tightly coupled, as demonstrated here.

Also, keep in mind that `startTransition()` will not update the `ItemsList` component if the `revalidatePath()` is called inside `POST` handler, this happens because:

1. When a Server Action is invoked, React treats it as part of the app's state. This tight integration allows React to re-render affected Server Components automatically when the action is used inside `startTransition()`.
2. API Route Revalidation Isn’t Tied to React:
   - When revalidation is triggered in an API route, React has no direct way to know that the cache was invalidated.
   - This is why an explicit mechanism like `router.refresh()` is required when relying solely on API route-based revalidation.

### Using `use` Hook in Server Components

Simplify data fetching in server components with the built-in `use` hook.

```jsx
// app/profile/page.tsx
import { use } from "react";

async function getProfileData(userId: string) {
  const res = await fetch(`https://api.example.com/user/${userId}`);
  return res.json();
}

export default function ProfilePage({ userId }: { userId: string }) {
  const data = use(getProfileData(userId));

  return ( <div> <h1>{data.name}</h1> <p>{data.bio}</p> </div>);
}
```

The `use()` hook is also capable of reading React Context, you can read more about it in the [React Docs](https://react.dev/reference/react/use).

### Optimistic UI & Reactive Updates

While not strictly a server-side caching strategy, Optimistic UI is a method to instantaneously show updated data while the server operation is still pending. This is typically done client-side, but you can combine it with Next.js:

1. Send an update request (e.g., mutate a resource).
2. Locally update the UI to reflect the change before the server confirms it.
3. Revalidate or refetch to ensure your local UI matches the server’s state.

As an example, you can use the code from [Mutate then Revalidate recipe](#mutate-then-revalidate) and change the `handleAddItem()` method in `ItemsForm` component:

```jsx
const handleAddItem = async () => {
	const optimisticItem = newItem;

	// Update UI Optimistically
	setItems((prev) => [...prev, optimisticItem]);
	setNewItem(''); // Clear input

	try {
		await fetch('/api/items', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ newItem }),
		});

		// Optional: Refetch the data to ensure consistency
	} catch (error) {
		console.error('Failed to add item:', error);
		setItems((prev) => prev.filter((item) => item !== optimisticItem)); // Revert optimistic update
	}
};
```

### Using 3rd-Party Caching Layers (e.g. Redis)

For high-traffic or data-intensive applications, you may need an external caching service like _Redis_ - it's often used for ephemeral caches, session storage, and real-time data.

You can read howto configure custom Next.js Cache Handler in the [Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath).

### Complex revalidation route handler with secret key guard

```jsx
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export enum RequestTag {
	GetItems = 'GetItems',
	GetUserProfile = 'GetUserProfile',
}

const withRevalidateCacheRouteGuard =
	(handler: (request: NextRequest) => Promise<NextResponse>) => async (req: NextRequest) => {
		if (req.method !== 'GET') {
			return new NextResponse('Method not allowed', {
				status: 405,
			});
		}

		const requestSecret = req.headers.get('x-api-secret');

		if (!requestSecret || requestSecret !== process.env.REVALIDATE_CACHE_SECRET) {
			return new NextResponse('Forbidden: Invalid secret', {
				status: 403,
			});
		}

		return handler(req);
	};

const validateTags = (tagsToValidate: string[]) => {
	const allTags = Object.values(RequestTag);

	tagsToValidate.forEach((tag) => {
		if (!allTags.includes(tag as RequestTag)) {
			throw new Error(`Invalid tag provided for revalidation: ${tag}`);
		}
	});
};

export const GET = withRevalidateCacheRouteGuard(async (req: NextRequest) => {
	try {
		const tagsSearchParam = req.nextUrl.searchParams.get('tags');

		// Revalidate all if there are no tags provided
		if (!tagsSearchParam) {
			const allTags = Object.values(RequestTag);

			for (const tag of allTags) {
				revalidateTag(tag);
			}

			return new NextResponse(
				JSON.stringify({
					success: true,
					message: `Cache revalidated successfully for all tags: ${allTags.join(', ')}`,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		} else {
			// Revalidate tags provided
			const tags = tagsSearchParam.split(',');

			validateTags(tags);

			for (const tag of tags) {
				revalidateTag(tag);
			}

			return new NextResponse(
				JSON.stringify({ success: true, message: `Cache revalidated successfully for tags: ${tags.join(', ')}` }),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}
	} catch (error: unknown) {
		const errorMessage = (error as Error).message || 'Internal server error revalidating cache.';

		return new NextResponse(JSON.stringify({ success: false, message: `Revalidation cache failed: ${errorMessage}` }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}
});
```

> In a typical project, you’d place `RequestTag` in a dedicated utility file or an `_enums/` directory to make it reusable across the application, rather than keeping it directly inside a single route. This keeps your code organized and makes tags accessible to any component or function that needs them for revalidation logic.

This route handler demonstrates a secure, structured approach for revalidating Next.js caches based on user-defined tags. It ensures that only valid requests carrying the correct API secret can initiate cache revalidation, enabling fine-grained control over which cached resources get updated. This can be especially useful in scenarios where you need to trigger cache revalidation on demand. For example, you may want to quickly revalidate certain tags when the content changed in database, ensuring that any outdated data is refreshed (if you don't have Webhook based _on-demand_ revalidation). In such cases, you can send a `GET` request (via _cURL_, _Postman_, or a _CI script_) to this endpoint, including the required secret header.

1. Purpose & Flow
   - Defines a secure endpoint that only accepts `GET` requests and requires a secret key to revalidate cached data.
   - If the request’s secret key is invalid or missing, the handler rejects the request.
2. Tag Revalidation
   - Uses a custom enum to define valid cache tags.
   - Ensures only recognized tags can be revalidated, throwing an error for any invalid ones.
3. Handling Different Inputs
   - When no specific tags are sent, all known tags are revalidated.
   - When specific tags are sent (comma-separated), each one is validated and then revalidated.
4. Error Handling
   - Employs a _try/catch_ structure.
   - Responds with detailed error messages in a consistent JSON format.
5. Extensibility
   - Straightforward to add more tags in the enum or adapt for additional logic.
   - Wraps the core logic in a higher-order function to keep the request checks (method, secret) separate from revalidation logic.

To use the `RequestTag` enum for on-demand or scheduled revalidation, you can pass it in the fetch options as shown below. When Next.js receives a subsequent request to this URL, it knows to cache (and later revalidate) based on the tag:

```jsx
await fetch('/api/items', {
	next: {
		revalidate: 60 * 60, // 60 minutes
		tags: [RequestTag.GetItems],
	},
});
```

## Best Practices & Common Pitfalls

1. Choose the Right Revalidate Interval
   - A short interval ensures fresher data but may cause more frequent regeneration.
   - A long interval reduces server load but risks serving stale content.
2. Leverage Edge Functions (if on _Vercel_)
   - Serve cached content closer to the user for faster performance, especially for global audiences.
   - Combine with revalidate to ensure data is kept fresh.
3. Use `no-store` for Highly Dynamic Content
   - If your data changes very frequently (e.g., stock prices), skip caching to prevent stale data.
   - Alternatively, consider partial caching strategies or websockets.
4. Be Mindful of Memory Footprint
   - Next.js in-memory caching is stored in the server’s memory, so large volumes of data can be expensive.
   - Offload large data sets to external caches (e.g., _Redis_) where needed.
5. Handle Errors Gracefully
   - If a fetch call fails, ensure your UI can handle it.
   - Use error.tsx or try-catch blocks around fetch to display fallback UI.
6. Check for overfetching
   - In server components, if multiple components fetch the same data, consider consolidating into a shared data-fetching layer or using cache() to reduce redundant calls.
7. Security & Authorization
   - Ensure no sensitive data is inadvertently cached or served to unauthorized users.
   - Use tokens or session-based approaches carefully, especially in SSR contexts.
8. Monitor & Test
   - Use performance monitoring tools to see real-world impacts of your caching strategy.
   - A/B test or canary test changes to your caching or revalidation to ensure no regressions.

### Memory Leak in Node.js

In some Node.js versions (e.g. `20.16.0`), we identified a memory leak in Next.js' `fetch` API. Each request using `fetch()` adds an entry to the in-memory cache but never clears it, potentially leading to an out-of-memory exception after multiple requests.

The simplest workaround is to downgrade Node.js to `20.15.1`. If you need to use a newer version than `20.16.x`, monitor memory usage to ensure stability.

For more details, refer to [this GitHub Discussion](https://github.com/vercel/next.js/discussions/68636).

### Changing cache key on every request

In Next.js, when caching fetch API calls, the cache key is generated based on the entire request object, including headers. This means that if your requests have unique headers per user—such as authorization tokens or cookies—the cache will store separate entries for each unique request. Consequently, with a large number of users and requests, this can lead to a significant number of cache entries, potentially causing an out-of-memory exception.

For instance, if you have 100 authorized users, each making 10 requests with unique headers, the cache could accumulate 1,000 distinct entries, even if the requested content is identical across users.

To mitigate this issue, consider implementing a custom caching strategy that normalizes cache keys for identical content, regardless of user-specific headers. This approach can help reduce redundant cache entries and manage memory usage more effectively.

For a deeper understanding of the cache key generation, you can review the [Next.js source code](https://github.com/vercel/next.js/blob/e02397d26473ac41a3d6dd6a396769b584dd0e49/packages/next/src/server/lib/patch-fetch.ts#L296) related to this functionality.

### Middleware affecting cache behavior

This is similar to the previous pitfall - middleware can modify requests and responses dynamically, which may lead to unexpected cache behavior. If a middleware alters headers, query parameters, or cookies before reaching a cached page, it can create different cache variations than expected.

For example, if middleware adds a `Set-Cookie` header dynamically, Next.js might treat every response as unique, leading to cache fragmentation.

To prevent this, ensure middleware does not modify request attributes that contribute to cache keys unless intentional.

### Misunderstanding Cache Revalidation

A common misconception in Next.js caching is that triggering cache revalidation (e.g., using [`revalidatePath()`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) or [`revalidateTag()`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)) immediately removes old cached data from memory or disk. Many developers assume that revalidation "clears" the previous cache, freeing up memory or storage.

However, cache revalidation does not delete the old data. Instead:

- Revalidation invalidates the cache entry, marking it as "stale."
- The old data remains in memory or disk until the next request to the revalidated route is made.
- Only when a new request is processed does Next.js fetch fresh data, update the cache, and remove the stale entry.

This behavior can lead to unexpected memory or storage issues, especially in scenarios with frequent revalidations:

- Old cache entries remain in memory, consuming valuable resources.
- If many paths are invalidated but not requested, the server's memory usage can grow significantly over time.

### Over-Caching dynamic data

By default, Next.js caches `fetch` calls indefinitely when used in static site generation. This means that if you're fetching dynamic data without specifying a caching strategy, you may end up serving stale content until the next rebuild.

For example, if your application fetches live stock prices but caches the response at build time, users will see outdated values until you trigger a new deployment.

To prevent this, set [`cache: 'no-store'`](https://nextjs.org/docs/app/api-reference/functions/fetch#optionscache) on `fetch()` for truly dynamic data. If partial caching is needed, use `next: { revalidate: X }` to refresh the data periodically while still benefiting from caching.

### `revalidate: 0` Misconception

Setting [`revalidate: 0`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate) does not enable _ISR_ - it actually forces server-side rendering on every request. This means every page load triggers a fresh request to the data source, which can significantly impact performance.

If your intent is to cache data but always refresh immediately, consider using a very low revalidate value instead (e.g., `revalidate: 1` for near real-time updates with caching).

### Stale Data in Incremental Static Regeneration

_ISR_ allows pages to be updated in the background, but users might still see stale data until a revalidation occurs. This is especially problematic for time-sensitive content like breaking news or live sports scores.

For example, if a blog post is updated but the revalidate interval is set to 10 minutes, users could still see old content for up to 10 minutes before Next.js regenerates the page.

To balance freshness and performance, choose an appropriate revalidate interval based on how often the content changes. For near real-time updates, consider switching to server-side rendering or client-side fetching instead of relying on ISR.

### Development vs Production caching

In development mode, Next.js does not cache `fetch` requests. This means that while your application might appear to fetch fresh data on every request during development, caching will behave differently in production.

For example, if you're testing an API response that should be cached for 5 minutes, you won't see this behavior locally. Instead, run the production build in Docker or deploy the app to a staging environment to test real-world caching behavior.

## Further Reading & Resources

- [Next.js Documentation on Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Caching on Vercel's Edge Network](https://vercel.com/docs/edge-network/caching)

## Motivation

Although the characters encoding issue is not an issue with NextJS but React (check more details [here](https://github.com/facebook/react/issues/13838)), you can encounter this if you have static pages that have some HTML entities in the page content - e.g. ampersand (`&`) in query parameters.

These HTML entities will not be encoded by default, which will result in incorrect content. This will pose an issue mostly for crawlers.

![Ampersand is encoded incorrect](/img/nextjs/nextjs_encoding_issue.jpg)

This can be fixed by adding a custom decode method in the `_document` file.

Disclaimer:

- Check if this issue is still happening
- Check if the fix is needed
- Always be cautious when changing default Next.js [custom document](https://nextjs.org/docs/advanced-features/custom-document#customizing-renderpage) configurations

> To prepare for React 18, we recommend avoiding customizing getInitialProps and renderPage, if possible.

## Implementation

If you do not have the `_document` file in the `pages` folder, create a file with the default content ([copy all except gIP in _document](https://nextjs.org/docs/advanced-features/custom-document#customizing-renderpage)) and:

- install the `html-entities` package (https://github.com/mdevils/html-entities)
- import the `html-entities` package

```javascript
import { decode } from 'html-entities';
```

- add the gIP implementation in the class

```jsx
static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    // based on https://github.com/vercel/next.js/issues/2006
    return {
        ...initialProps,
        html: initialProps.html.replace(
            /(href|src|srcSet)="([^"]+)"/g,
            (match, attribute, value) => `${attribute}="${decode(value)}"`
        ),
    };
}
```

- add or change regex properties to handle more cases

The above code searches and replaces all `href`, `src` and `srcSet` attributes in all pages with decoded characters.

![Ampersand is now encoded correctly](/img/nextjs/nextjs_encoding_fixed.jpg)

## Conclusion

If you need to encode HTML entities, the proposed solution will work well. There is no need to add this by default.

## Always expose internal constants (magic numbers) as props

If we need some "magic number" inside our component we will usually do something like this:

The problem ⚡

```tsx
const HEIGHT = 72;

const Example: FC = ({ children }) => {
	const position = calculatePositionBasedOnHeight(HEIGHT);

	return (
		<div style={{ height: HEIGHT }}>
			<div style={{ position: 'absolute', left: position.x, top: position.y }}>{children}</div>
		</div>
	);
};
```

Maybe we don't see it right away, and we might think that this component will always have the same height everywhere. But it usually turns out differently.

The solution ✅

Always expose "magic numbers" as props because there is a really big chance that we will need to change it in some specific use-case.

```tsx
const HEIGHT = 72;

export interface IExampleProps {
	height?: number;
}

const Example: FC<IExampleProps> = ({ children, height = HEIGHT }) => {
	const position = calculatePositionBasedOnHeight(height);

	return (
		<div style={{ height }}>
			<div style={{ position: 'absolute', left: position.x, top: position.y }}>{children}</div>
		</div>
	);
};
```

## Shadowing props in higher abstractions is a bad habit

When we are creating a higher abstractions out of our base components, we usually think that we want to disallow the prop that we override internally. But usually it's a bad thing because you are narrowing down reusability of that component.

The problem ⚡

```tsx
// Base component
interface IImageProps {
	src?: string;
	loader?: (src) => string;
}

const Image: FC<IImageProps> = ({ loader, src }) => {
	const internalSrc = loader?.(src) || src;

	return <img src={src} {...props} />;
};

// Higher abstraction component
interface IMyImageProps extends Omit<IImageProps, 'loader'> {
	// ...
}

// Cache busting!
const myLoader = (src = `${src}?timestamp=${Date.now()}`);

const MyImage: FC<IMyImageProps> = (props) => {
	<Image {...props} loader={myLoader} />;
};
```

This is a problem because we shadowed the `loader` prop and we can't opt-out from this behavior anymore.
What would we usually do in this situation is start adding multiple boolean flags for every edge-case we encounter.
And we would ship that `if/else` code with every component include, whether we use it or not.

```tsx
// Higher abstraction component
interface IMyImageProps extends Omit<IImageProps, 'loader'> {
	// ...
	isSomeEdgeCase?: boolean;
}

// Cache busting!
const myLoader = (src = `${src}?timestamp=${Date.now()}`);
const edgeCaseLoader = (src = `${src}?timestamp=${Date.now()}&w=500`);

const MyImage: FC<IMyImageProps> = (props) => {
	const loader = props.isSomeEdgeCase ? edgeCaseLoader : myLoader;

	// we start adding more and more if/else statements here and code grows out of proportions

	<Image {...props} loader={loader} />;
};
```

The solution ✅

There is no real reason to omit `loader` prop. We can just provide sane default value and leave the overriding ability for specific one-off cases.

```tsx
interface IMyImageProps extends IImageProps {
	// ...
}

const myLoader = (src = `${src}?timestamp=${Date.now()}`);

const MyImage: FC<IMyImageProps> = (props) => {
	<Image loader={myLoader} {...props} />;
};
```

And if for one edge-case we need to include `w=500` in the URL, we can do it like this:

```tsx
<MyImage src="..." loader={(...args) => `${myLoader(...args)}&w=500`} />
```

## datx

> [datx.dev - A mobx data store](https://datx.dev/)
>
> DatX is an opinionated JS/TS data store. It features support for simple property definition, references to other models, and first-class TypeScript support.
>
> To find out more about DatX, check out the [official documentation](https://datx.dev/).

To set up datx store, first, we need to install DatX dependency. To do this, follow [the official documentation](https://datx.dev/docs/getting-started/installation).

After that, we can [create a collection](https://datx.dev/docs/getting-started/configuring-the-collection) and [models](https://datx.dev/docs/getting-started/defining-models).

```ts
import { Collection } from '@datx/core';

export class Client extends Collection {
	public static types = [];
}
```

`types` variable should be a populated array with the model that your app uses. For the sake of this demonstration, it will be empty, but in the last section of this page, some examples will be shown.

> To find out more about Datx, check out the [official documentation](https://datx.dev/).

### JSON:API Client

If you are working with a JSON:API, `datx` can handle that too - hello `datx-jsonapi`. This library provides multiple decorators that you can use to adapt collection and models to work with JSON:API. Read more about [JSON:API](https://jsonapi.org/) and [datx-jsonapi](https://datx.dev/docs/jsonapi/jsonapi-getting-started)

### Extra

If you want to follow along completely, here is a list of all needed dependencies:

- [datx](https://datx.dev/)
- [dequal](https://github.com/lukeed/dequal)
- [mobx](https://mobx.js.org/README.html)
- [swr](https://swr.vercel.app/)

After datx store is initialized, we will create a datx context that will enable us to use DatX in our web application. For the context, we will need a provider - `DatxProvider`and a hook - `useDatx`.

## DatxProvider

> For frontend network layer we will use [SWR](https://swr.vercel.app/) library created by Vercel.

```tsx
// DatxProvider.tsx

import { createContext, FC } from 'react';
import { SWRConfig } from 'swr';
import { dequal } from 'dequal/lite';

import { Client } from './Client';

export const DatxContext = createContext<Client>(null);

interface IDatxProviderProps {
	client: Client;
}

export const DatxProvider: FC<IDatxProviderProps> = ({ client, children }) => (
	<DatxContext.Provider value={client}>
		<SWRConfig value={{}}>{children}</SWRConfig>
	</DatxContext.Provider>
);
```

Let's break things up into sections:

- `DatxContext` is just a new context that will be used for our datx store

- `Client` is our datx store

- `DatxProvider` is a wrapper that will serve the context along with some default swr config

- `SWRConfig` is a provider for swr config defaults. Currently, this is empty but if there is a config that should be used for every swr hook, this is a good place to change that.

Once the provider is created, wrap your whole application inside the created provider. In React application, you can do this in `index.ts` file and in Next.js application, you can do this in `_app.ts` file.

## useDatx

As mentioned, `useDatx` is a hook that will expose datx context in our component. To make it simpler, we will wrap `useContext` hook in our new `useDatx` hook.

```ts
// useDatx.ts

import { useContext } from 'react';

import { DatxContext } from './context';

export function useDatx() {
	const client = useContext(DatxContext);

	if (!client) {
		throw new Error('useDatx must be used inside DatxProvider');
	}

	return client;
}
```

This hook will throw an error if `useDatx` is called without `DatxProvider`. _If you followed the previous step, this will be already implemented in a `index` or `_app` file._

## Usage

In this section, an example will be shown. Before we start, we'll create a model, i.e. Todo.

```ts
import { Attribute, Model } from '@datx/core';

export class Todo extends Model {
	static type = 'todo';

	@Attribute({ isIdentifier: true })
	public id!: string | number;

	@Attribute()
	public title!: string;

	@Attribute()
	public completed!: boolean;

	@Attribute()
	public createdAt!: string;
}
```

Now we need to modify our collection and add this model to types array.

```ts
import { Todo } from 'models';

export class Client extends Collection {
	public static types = [Todo];
}
```

Once this is set up, and if we assume that all steps defined in this document are done, we can start fetching. For this example, we'll create a component that will fetch `todos` from the API and render them on the page.

Before we create a component, we will create a fetcher.

```tsx
export const getTodos = async (datx) => {
	const response = await fetch('/todos');
	const rawTodos = await response.json();
	const todos = rawTodos.map((rawTodo) => datx.add(rawTodo, 'todo'));

	return todos;
};
```

Now, we can use the fetcher to create a component.

```tsx
import React, { FC } from 'react';
import useSWR from 'swr';

import { useDatx } from 'store';

export const TodoListSection: FC = (props) => {
	const datx = useDatx();
	const { data: todos, error } = useSWR('/todos', () => getTodos(datx));

	if (error) {
		return (
			<div {...props}>
				<p>Something went wrong.</p>
			</div>
		);
	}

	if (!todos) {
		return <div {...props}>Loading todos...</div>;
	}

	return (
		<section {...props}>
			{todos.length === 0 && <p>No todos.</p>}
			{todos.map((todo) => (
				<div className="flex">
					<input type="checkbox" defaultChecked={todo.completed} />
					<p>{todo.title}</p>
				</div>
			))}
		</section>
	);
};
```

## JSON:API usage

Here at Infinum, we like to use [JSON:API specification](https://jsonapi.org/). To make the stack easier to maintain, DatX has an extension just for that, JSON:API, specification - [@datx/jsonapi](https://datx.dev/docs/jsonapi/jsonapi-getting-started). If you want to know more about that, please read more at [the official documentation site](https://datx.dev/docs/jsonapi/jsonapi-getting-started). For the purposes of this example, we'll create a model and show a short demonstration how to implement DatX jsonapi it in your application.

To create a JSON:API model you need to decorate existing DatX model using `jsonapi` decorator method from the package.

```ts
import { Attribute, Model } from '@datx/core';
import { jsonapi } from '@datx/jsonapi';

export class Flight extends jsonapi(Model) {
	static type = 'flight';

	@Attribute({ isIdentifier: true })
	public id!: string | number;

	@Attribute()
	public airplaneModel!: string;

	@Attribute()
	public departsAt!: string;

	@Attribute()
	public arrivesAt!: string;

	@Attribute()
	public basePrice!: string;

	@Attribute()
	public currentSeatPrice!: string;

	@Attribute()
	public name!: string;
}
```

Then, we can use this model to create out store:

```ts
import { Collection } from '@datx/core';

import { Flight } from 'models/flight';

export class AppCollection extends jsonapi(Collection) {
	public static types = [Flight];
}
```

Now, once this is setup we also need to provide out config to DatX. To do this, we need to use `config` object from `@datx/jsonapi`.

```ts
import { config, CachingStrategy, IRawResponse, ICollectionFetchOpts } from '@datx/jsonapi';

import { apify, deapify } from 'utils/api';

// since we are using swr, swr will handle cache
config.cache = CachingStrategy.NetworkOnly;

// base url of an api service
config.baseUrl = 'http://localhost:3000/api/v1/';

// these fetch options will be included on every request
config.defaultFetchOptions = {
	// JSON:API standard requires to provide following headers. The default headers required by the spec are added by default, but you're able to override this.
	headers: {
		Accept: 'application/vnd.api+json',
		'Content-Type': 'application/vnd.api+json',
	},
	credentials: 'include',
};

// in order to handle attributes in camelCase rather than snake_case, we'll transform all prop names to camelCase
config.transformResponse = (opts: IRawResponse) => {
	return { ...opts, data: deapify(opts.data) };
};

// same as previous step, but in reverse; all prop names from camelCase to snake_case
config.transformRequest = (opts: ICollectionFetchOpts) => {
	return { ...opts, data: apify(opts.data) };
};
```

Mentioned methods `apify` and `deapify` are using `lodash` methods under the hood. For that you'll need to install `lodash` (or only the specific lodash methods) as well:

```bash
pnpm install -E lodash
```

```ts
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';

/**
 * Deep iteration trough an object and transformation
 *
 * @param obj - Object that needs to be Transformed
 * @param transformer - Transformer function
 * @return Transformed object
 */
export function iterator(
	obj: object | undefined,
	transformer: typeof snakeCase | typeof camelCase
): object | undefined {
	if (isArray(obj)) {
		return map(obj, (value) => iterator(value, transformer));
	}
	if (isObject(obj)) {
		const copy = mapValues(obj, (value) => iterator(value, transformer));

		return mapKeys(copy, (_, key) => transformer(key));
	}

	return obj;
}

export function apify(obj?: object) {
	return iterator(obj, snakeCase);
}

export function deapify(obj?: object) {
	return iterator(obj, camelCase);
}
```

Now, everything is ready for usage in the components:

```tsx
import React, { FC } from 'react';
import useSWR from 'swr';

import { useDatx } from 'store';
import { Flight } from 'models/flight';

export const FlightDetailsSection: FC = ({ flightId, ...rest }) => {
	const datx = useDatx();

	const { data: flightResponse, error } = useSWR(
		() => (flightId ? `${Flight.type}-${flightId}` : null), // swr key
		() => datx.getOne(Flight, flightId) // swr fetcher
	);

	if (error) {
		// implement better error handling, this is just for demo purposes
		return <div {...rest}>Flight fetch error occurred</div>;
	}

	if (!flightResponse.data) {
		// implement better loading state, this is just for demo purposes
		return <div {...rest}>Loading data...</div>;
	}

	return (
		<div {...rest}>
			{/* Handle flight data */}
			{JSON.stringify(flightResponse.data)}
		</div>
	);
};
```

As you can see this is not really complicated to set up. But all of this becomes hard to track once you have multiple places with request filters etc. Because swr uses the key attribute to cache data and JSON:API supports multiple different parameters, key handling becomes an difficult task. To bypass that, we created a piece of code with better abstraction that will connect three things - DatX, React and SWR. You can checkout the implementation in [our React example repo](https://github.com/infinum/JS-React-Example/tree/master/src/libs/%40datx/jsonapi-react).

## Motivation

When developing applications, you sometimes want to test your local changes against data from a different environment. For example, creating a production hotfix requires you to locally connect to the production API. Maybe even testing the solution on a different device, e.g. a [phone connected to your machine](https://developers.google.com/web/tools/chrome-devtools/remote-debugging). That API could have http-only cookies that cannot be manipulated on the client and require a proxy that can intercept some requests and do some modifications to them.

## The issue

NextJS already supports/recommends ways to proxy outgoing requests:

- [custom reverse proxy](https://github.com/vercel/next.js/tree/master/examples/with-custom-reverse-proxy)
- [redirects](https://nextjs.org/docs/api-reference/next.config.js/redirects)

The problem with the former is that it runs on a different server. When testing local changes on e.g. a phone, we will get unresolvable CORS issues.
The problem with the latter is that NextJS redirects don't provide a possibility to manipulate requests and/or responses. They just redirect.

## The fix

Prerequisites:

- Install [`http-proxy-middleware`](https://github.com/chimurai/http-proxy-middleware): `npm install http-proxy-middleware`
- NextJS [API Routes](https://nextjs.org/docs/api-routes/introduction) with the [Optional catch all API route](https://nextjs.org/docs/api-routes/dynamic-api-routes#optional-catch-all-api-routes)
- NextJS [API middleware](https://nextjs.org/docs/api-routes/api-middlewares) using [`http-proxy-middleware`](https://github.com/chimurai/http-proxy-middleware)
- a way to set the proper URL for the proxy (`NEXT_PUBLIC_BASE_URL` in this case)

You can create a reusable `createProxy` in your code base, and then use it in your API routes:

```ts
// src/lib/proxy/index.ts

import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { NextApiRequest, NextApiResponse } from 'next';

interface ICreateProxyOptions extends Omit<Options, 'apiUrl'> {
	/**
	 * Used for disabling the proxy. By default it's enabled only in development.
	 *
	 * @default process.env.NODE_ENV !== 'development'
	 *
	 * @example
	 *
	 * createProxy('http://localhost:3000', {
	 *   disable: NODE_ENV === 'production'
	 * })
	 *
	 * @example
	 *
	 * createProxy('http://localhost:3000', {
	 *   disable: (req) => req.headers['x-skip-proxy'] === 'true'
	 * })
	 */
	disable?: boolean | ((req: NextApiRequest) => boolean);
}

export const createProxy = (apiUrl: Options['target'], options: ICreateProxyOptions = {}) => {
	const { disable = process.env.NODE_ENV !== 'development', ...proxyOptions } = options;

	const proxy = createProxyMiddleware({
		target: apiUrl,
		// changeOrigin: true ensures the Host header is rewritten to match the target
		changeOrigin: true,
		// Rewrite cookie domain to localhost so cookies work in development
		cookieDomainRewrite: 'localhost',
		// Remove /api prefix before forwarding to target
		pathRewrite: { '^/api': '/' },
		...proxyOptions,
		onProxyRes: (proxyRes: any, req: any, res: any) => {
			// You can manipulate the cookie here
			// This is necessary because production APIs often set secure cookies
			// that won't work over HTTP localhost

			if (!proxyRes.headers['set-cookie']) {
				return;
			}

			// For example you can remove secure and SameSite security flags so browser can save the cookie in dev env
			// Secure cookies require HTTPS, and SameSite=None requires Secure flag
			const adaptCookiesForLocalhost = proxyRes.headers['set-cookie'].map((cookie: string) =>
				cookie.replace(/; secure/gi, '').replace(/; SameSite=None/gi, '')
			);

			proxyRes.headers['set-cookie'] = adaptCookiesForLocalhost;

			if (proxyOptions.onProxyRes && typeof proxyOptions.onProxyRes === 'function') {
				proxyOptions.onProxyRes(proxyRes, req, res);
			}
		},
		onError: (err: any, req: any, res: any, target: any) => {
			console.error(err);

			if (proxyOptions.onError && typeof proxyOptions.onError === 'function') {
				proxyOptions.onError(err, req, res, target);
			}
		},
	}) as (req: NextApiRequest, res: NextApiResponse<unknown>) => void;

	return function handler(req: NextApiRequest, res: NextApiResponse<unknown>) {
		if (typeof disable === 'function' ? disable(req) : disable) {
			return res.status(404).json({ message: 'Not found' });
		}

		return proxy(req, res);
	};
};
```

Use the `createProxy` function in your API routes:

```js
// pages/api/[[...slug]].ts

import { createProxy } from '@/lib/proxy';

export default createProxy(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1`, {
	secure: false,
	pathRewrite: { '^/api/backend': '/' },
});

export const config = {
	api: {
		// Disable body parsing so we can stream the request body
		bodyParser: false,
		// Tell Next.js this route is handled externally
		externalResolver: true,
	},
};
```

## The implications

The only problem with this approach is that the defined NextJS route (`pages/api/[[...slug]]`) can be reached in production because NextJS doesn't support conditional removal of API routes. The `disable` option in `createProxy` handles this by checking if the current environment is NOT "development" and returning a 404. This ensures the proxy is effectively disabled in production.

# Motivation

Handling errors is really important for any production ready app. By proper handling of error we can prevent degradation of user experience in production.
Luckily, React gave use the right tool for this job, and it's called [Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

## Used modules

1. [SWR](https://github.com/vercel/swr) ([docs](https://swr.vercel.app/))
2. [@bugsnag/plugin-react](https://github.com/bugsnag/bugsnag-js/tree/next/packages/plugin-react) ([docs](https://docs.bugsnag.com/platforms/javascript/react/))

## Error handling done right!

```tsx
const Announcements = ({ eventId }) => {
  const { data, error } = useSWR(`/api/v1/announcements?filter[event_id]=${eventId}`);

  if (error) {
    // Error is handled outside, in BugsnagErrorBoundary
    throw error;
  }

  if (!data) {
    // Loading data
    return <AnnouncementsSkeleton />
  }

  return (
    <div>
      {data?.map(announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />}
    </div>
  );
}
```

Then in the parent component:

```tsx
<BugsnagErrorBoundary FallbackComponent={ErrorFallback}>
	<Announcements eventId={eventId} />
</BugsnagErrorBoundary>
```

```tsx
// ./src/components/shared/overlays

const ErrorFallback = (error, info, clearError) => {
	return <button onClick={clearError}>Refresh</button>;
};
```

## What do you get with this:

1. You are only handling a happy path in the component
2. Reusable error handling for API calls on one place
3. Error handling for any JS error that could happen in the production
4. Only this part of the app will stop working, not the whole App
5. Bugsnag reports

## NextJS App Router

Using an `error.tsx` file in your app’s directory structure is recommended for handling global and route-level errors, however, it’s not mandatory if you want more fine-grained control over error handling at the component level using custom error boundaries (like the Bugsnag example).

For a robust error-handling strategy, it’s often best to combine both approaches:

- Global Fallback with `error.tsx`: Fallback for unhandled errors across routes and layouts. This ensures users always see a helpful message rather than a blank screen if an error goes uncaught by component-level boundaries.
- Component-Level Error Boundaries: Use them around specific components or sections that might fail due to network issues, user input, or other isolated factors. This allows you to manage errors locally without impacting the whole route and offers a better experience for users.

## Useful links

1. [Bugsnag with Next.js pages router example](https://github.com/bugsnag/bugsnag-js/tree/master/examples/js/nextjs)
2. [Use react-error-boundary to handle errors in React](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
3. If you don't have Bugsnag you can use this dependency instead [react-error-boundary](https://www.npmjs.com/package/react-error-boundary)

## The Problem ⚡

When we think about design (slicing of the web page) we usually think in a page based context.  
In design file we get set of pages which consists of UI elements, and if we start extracting our components based on the single page view we often end up with a lot of un-reusable one-off components. Those component will bloat out codebase more and more as project grows. Bundle size will become bigger because we will generate a lot of JS code per each new page, which will eventually slow down our page.

To solve this component we need to shift our mindset from vertical (page based) "slicing" flow to horizontal flow.

<figure>
  <img src="/handbook/img/frontend/react-recipes/vertical_vs_horizontal.svg">
  <figcaption style="text-align: center">
    <a href="/handbook/img/frontend/react-recipes/vertical_vs_horizontal.svg" >Vertical vs Horizontal Flow</a>
  </figcaption>
</figure>

To do this we need to focus more on Design System and reusability of our components.
If your design doesn't have any Design System you should ask designer to make on. Here is the example of [Chakra UI Design System](https://www.figma.com/community/file/971408767069651759) made in Figma.

### Card design

Here is the simple example of two different card designs, `user` card in the first row and the `job` card.

![Cards](/img/react-recipes/cards.png)

### Multiple similar cards

First step is to bootstrap the layout with inline props.

```tsx
// ./src/components/shared/user/UserCard/UserCard.styles.tsx

import * as React from 'react';
import { Box, Heading, Image, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { IUser } from '../../../../interfaces/IUser';

export interface IUserCardProps {
	user: IUser;
}

export const UserCard: FC<IUserCardProps> = ({ user }) => (
	<Box borderRadius="md" border="1px" borderColor="gray.200">
		<Image
			src={user.picture}
			borderRadius="full"
			w="150px"
			h="150px"
			fit="cover"
			mb="4"
			mt="4"
			mx="auto"
			bg="gray.200"
		/>
		<Heading as="h1" size="sm" px="5" mb="4" textAlign="center">
			{`${user.name} ${user.surname}`}
		</Heading>
		<Text fontSize="xs" px="5" mb="5" noOfLines={3} textAlign="center">
			{user.bio}
		</Text>
	</Box>
);
```

```tsx
// ./src/components/shared/user/JobCard/JobCard.tsx

import * as React from 'react';
import { Box, Heading, Image, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { IJob } from '../../../../interfaces/IJob';

export interface IJobCardProps {
	job: IJob;
}

export const JobCard: FC<IJobCardProps> = ({ job }) => (
	<Box borderRadius="md" border="1px" borderColor="gray.200">
		<Image src={job.thumbnail} borderTopRadius="md" w="100%" h="200px" fit="cover" mb="4" />
		<Heading as="h1" size="sm" px="5" mb="4">
			{job.title}
		</Heading>
		<Text fontSize="xs" px="5" pb="5" noOfLines={3}>
			{job.description}
		</Text>
	</Box>
);
```

### When this is OK?

When we are building a small one-off components which doesn't contain a lot of code and are not shared across components.

### Why this approach can become a problem?

This example is not as bad as it seems on a first glance. It's actually a good solution because we don't have to name components, and we all know that naming is hard. But the problem would appear if this component grows in size and new features are added. Actually, the inline style may become a problem.
Problem with inline styles is that they can easily clutter the code and decrease readability.  
When that happens we need to find a way to overcome this problem.

## The Solution ✅

### Solution #1

Isolating smaller parts into styled components and extracting them to `ComponentName.elements.tsx` file.

```tsx
// ./src/components/shared/user/UserCard/UserCard.elements.tsx

import { AspectRatio, chakra, Heading, Text } from '@chakra-ui/react';

export const Card = chakra('div', {
	baseStyle: {
		borderRadius: 'md',
		border: '1px',
		borderColor: 'gray.200',
		boxShadow: 'xl',
		minW: 0,
	},
});

export const CardImageAspectRatio = chakra(AspectRatio, {
	baseStyle: {
		my: 2,
		mb: 4,
		mx: { base: 4, md: 10 },
	},
});

export const CardImage = chakra('img', {
	baseStyle: {
		borderRadius: 'full',
		w: '100%',
		h: '100%',
		objectFit: 'cover',
		bg: 'gray.200',
	},
});

export const CardHeading = chakra(Heading, {
	baseStyle: {
		px: 5,
		mb: 4,
		textAlign: 'center',
	},
});

export const CardDescription = chakra(Text, {
	baseStyle: {
		fontSize: 'xs',
		px: 5,
		mb: 5,
		textAlign: 'center',
	},
});
```

Then we can use it like this:

```tsx
// ./src/components/shared/user/UserCard/UserCard.tsx

import * as React from 'react';
import { FC } from 'react';

import { IUser } from '../../../../interfaces/IUser';

import { Card, CardText, CardHeading, CardImage, CardImageAspectRatio } from './UserCard.elements';

export interface IUserCardProps {
	user: IUser;
}

export const UserCard: FC<IUserCardProps> = ({ user }) => (
	<Card>
		<CardImageAspectRatio ratio={1 / 1}>
			<CardImage src={user.picture} />
		</CardImageAspectRatio>
		<CardHeading size="sm">{`${user.name} ${user.surname}`}</CardHeading>
		<CardText noOfLines={3}>{user.bio}</CardText>
	</Card>
);
```

> The same thing should be done with the JobCard component.

<iframe 
  src="https://codesandbox.io/embed/recipe-how-to-build-core-components-v1-l3ytyy?fontsize=14&hidenavigation=1&theme=dark"
  class="codesandbox"
  style="width:100%; max-width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden; box-shadow:rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;"
  title="recipa-how-to-build-core-components-v1"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

### When to use solution #1:

1. When component becomes cluttered and hard to read.
2. There is no clear indications that component is designed in multipart manner.

### Solution #2

Extracting styled props into `SystemStyleObject` objects and extracting them to `ComponentName.styles.tsx` file.

```tsx
// ./src/components/shared/user/UserCard/UserCard.tsx

import { SystemProps } from '@chakra-ui/react';

export const cardStyles: SystemProps = {
	borderRadius: 'md',
	border: '1px',
	borderColor: 'gray.200',
	boxShadow: 'xl',
	minW: 0,
};

export const cardImageContainerStyles: SystemProps = {
	my: 2,
	mb: 4,
	mx: { base: 4, md: 10 },
};

export const cardImageStyles: SystemProps = {
	borderRadius: 'full',
	w: '100%',
	h: '100%',
	bg: 'gray.200',
	objectFit: 'cover',
};

export const cardHeadingStyles: SystemProps = {
	px: '5',
	mb: '4',
	textAlign: 'center',
};

export const cardTextStyles: SystemProps = {
	fontSize: 'xs',
	px: '5',
	mb: '5',
	textAlign: 'center',
};
```

```tsx
// ./components/shared/user/UserCard/UserCard.tsx

import * as React from 'react';
import { AspectRatio, Box, Heading, Image, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { IUser } from '../../../../interfaces/IUser';
import {
	cardImageContainerStyles,
	cardImageStyles,
	cardStyles,
	cardHeadingStyles,
	cardTextStyles,
} from './UserCard.styles';

export interface IUserCardProps {
	user: IUser;
}

export const UserCard: FC<IUserCardProps> = ({ user }) => (
	<Box {...cardStyles}>
		<AspectRatio ratio={1 / 1} {...cardImageContainerStyles}>
			<Image src={user.picture} {...cardImageStyles} />
		</AspectRatio>
		<Heading as="h1" size="sm" {...cardHeadingStyles}>
			{`${user.name} ${user.surname}`}
		</Heading>
		<Text noOfLines={3} {...cardTextStyles}>
			{user.bio}
		</Text>
	</Box>
);
```

<iframe 
  src="https://codesandbox.io/embed/recipe-how-to-build-core-components-v2-pyokb?fontsize=14&hidenavigation=1&theme=dark"
  style="width:100%; max-width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden; box-shadow:rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;"
  title="recipa-how-to-build-core-components-v2"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

### When to use solution #2:

There is no significant difference between solution #1 and #2.
Benefits of #2 are that you can easily compose multiple styles together.

For example:

```tsx
<chakra.div sx={{ ...cardImageStyles, ...cardHeadingStyles }} />
```

### Solution #3

Creating a `core` card component by using a theme and make it reusable [compound component](https://kentcdodds.com/blog/compound-components-with-react-hooks).

> Compound Component is also called Multipart or Composite Component

#### Create a theme

To make highly reusable compound component we need to think about component anatomy.
Component anatomy means that we have to break component into a multiple parts.

In the case of our Card component we can break it in these four parts:

1. card
2. image
3. title
4. body

#### Defining the anatomy

```tsx
import { anatomy, Anatomy } from '@chakra-ui/theme-tools';

const parts = anatomy('card').parts('card', 'image', 'title', 'body');

type CardAnatomy = Anatomy<typeof parts.__type>;
```

#### baseStyles

The base styles for each part

```tsx
const baseStyle: PartsStyleObject<CardAnatomy> = {
	card: {
		borderRadius: 'md',
		border: '1px',
		borderColor: 'gray.200',
		boxShadow: 'xl',
	},
	body: {
		fontSize: 'xs',
		px: '5',
		mb: '5',
	},
};
```

#### variants

The variant styles for each part.

```tsx
const variantSolid: PartsStyleFunction<CardAnatomy> = (props) => {
	return {
		image: {
			borderTopRadius: 'md',
			w: '100%',
			h: '200px',
			objectFit: 'cover',
			mb: '4',
		},
		title: {
			px: '5',
			mb: '4',
		},
	};
};

const variantRounded: PartsStyleFunction<CardAnatomy> = (props) => {
	return {
		image: {
			borderRadius: 'full',
			w: '100%',
			h: '100%',
			objectFit: 'cover',
			bg: 'gray.200',
		},
		title: {
			px: '5',
			mb: '4',
			textAlign: 'center',
		},
		body: {
			textAlign: 'center',
		},
	};
};

const variants: MultiStyleConfig<CardAnatomy>['variants'] = {
	solid: variantSolid,
	rounded: variantRounded,
};
```

#### Complete implementation of the card theme

```tsx
// ./src/styles/components/card.ts

import { MultiStyleConfig, PartsStyleObject, PartsStyleFunction, anatomy, Anatomy } from '@chakra-ui/theme-tools';

const parts = anatomy('card').parts('card', 'image', 'title', 'body');
type CardAnatomy = Anatomy<typeof parts.__type>;

const baseStyle: PartsStyleObject<CardAnatomy> = {
	card: {
		borderRadius: 'md',
		border: '1px',
		borderColor: 'gray.200',
		boxShadow: 'xl',
	},
	body: {
		fontSize: 'xs',
		px: '5',
		mb: '5',
	},
};

const variantSolid: PartsStyleFunction<CardAnatomy> = (props) => {
	return {
		image: {
			borderTopRadius: 'md',
			w: '100%',
			h: '200px',
			objectFit: 'cover',
			mb: '4',
		},
		title: {
			px: '5',
			mb: '4',
		},
	};
};

const variantRounded: PartsStyleFunction<CardAnatomy> = (props) => {
	return {
		image: {
			borderRadius: 'full',
			w: '100%',
			h: '100%',
			objectFit: 'cover',
			bg: 'gray.200',
		},
		title: {
			px: '5',
			mb: '4',
			textAlign: 'center',
		},
		body: {
			textAlign: 'center',
		},
	};
};

const variants: MultiStyleConfig<CardAnatomy>['variants'] = {
	solid: variantSolid,
	rounded: variantRounded,
};

const defaultProps: MultiStyleConfig<CardAnatomy>['defaultProps'] = {
	variant: 'solid',
};

export default {
	parts: parts.keys,
	baseStyle,
	defaultProps,
	variants,
} as MultiStyleConfig<CardAnatomy>;
```

After a card theme is done we'll update the theme to include the new Card component style.

```tsx
import { extendTheme } from '@chakra-ui/react';

import Card from './components/card';

export const theme = extendTheme({
	components: {
		Card,
	},
});
```

#### Card component

Now we can implement the actual Card component.

#### Consuming style config

Since the new Card component is not part of Chakra UI we need to create a new React component and consume the style we just created. We can do that using `useMultiStyleConfig` hook.

#### useMultiStyleConfig API

```tsx
const styles = useMultiStyleConfig('Card', props);
```

> [API Docs](https://chakra-ui.com/docs/styled-system/theming/component-style#usemultistyleconfig-api)

#### Using StylesProvider

In the root component, we can access the whole style config and provide it to all the parts via `StylesProvider` context provider. This way we can, for example, set the variant only on the root element and all the parts will inherit that variant styles.

```tsx
import { chakra, forwardRef, ThemingProps, useMultiStyleConfig, createStylesContext } from '@chakra-ui/react';

const [CardStylesProvider, useCardStyles] = createStylesContext('Card');

export const Card = forwardRef<CardProps, 'div'>((props, ref) => {
	const { children } = props;

	const styles = useMultiStyleConfig('Card', props);

	return (
		<CardStylesProvider value={styles}>
			<chakra.div ref={ref} __css={styles.card} {...props}>
				{children}
			</chakra.div>
		</CardStylesProvider>
	);
});

export const CardImage = forwardRef<ImageProps, 'img'>((props, ref) => {
	const { image } = useCardStyles();

	return <Image ref={ref} {...image} {...props} />;
});
```

#### Complete example

```tsx
// ./src/components/core/Card/Card.tsx

import {
	chakra,
	forwardRef,
	Heading,
	HeadingProps,
	HTMLChakraProps,
	Image,
	ImageProps,
	Text,
	TextProps,
	ThemingProps,
	useMultiStyleConfig,
	createStylesContext,
} from '@chakra-ui/react';
import { __DEV__ } from '@chakra-ui/utils';

const [CardStylesProvider, useCardStyles] = createStylesContext('Card');

export interface CardOptions {}

export interface CardProps extends HTMLChakraProps<'div'>, CardOptions, ThemingProps {}

export const Card = forwardRef<CardProps, 'div'>((props, ref) => {
	const { children } = props;

	const styles = useMultiStyleConfig('Card', props);

	return (
		<CardStylesProvider value={styles}>
			<chakra.div ref={ref} __css={styles.card} {...props}>
				{children}
			</chakra.div>
		</CardStylesProvider>
	);
});

if (__DEV__) {
	Card.displayName = 'Card';
}

export const CardImage = forwardRef<ImageProps, 'img'>((props, ref) => {
	const { image } = useCardStyles();

	return <Image ref={ref} {...image} {...props} />;
});

if (__DEV__) {
	CardImage.displayName = 'CardImage';
}

export const CardTitle = forwardRef<HeadingProps, 'h2'>((props, ref) => {
	const { title } = useCardStyles();

	return <Heading ref={ref} {...title} {...props} />;
});

if (__DEV__) {
	CardTitle.displayName = 'CardTitle';
}

export const CardBody = forwardRef<TextProps, 'h2'>((props, ref) => {
	const { body } = useCardStyles();

	return <Text ref={ref} {...body} {...props} />;
});

if (__DEV__) {
	CardBody.displayName = 'CardBody';
}
```

<iframe 
  src="https://codesandbox.io/embed/recipe-how-to-build-core-components-v3-ko2g9?fontsize=14&hidenavigation=1&theme=dark"
  class="codesandbox"
  style="width:100%; max-width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden; box-shadow:rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;"
  title="recipa-how-to-build-core-components"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

### When to use solution #3:

1. When you have clear design indications of multiple similar components with similar features but slightly different styles
2. Designer prepared component variants and anatomy

> Chakra UI already includes `Card` component form version v2.4
> When you are working with refs you have control over the `update` phase but you don't have a way to trigger it imperatively. But, if you still need to trigger an update imperatively, you can use a custom `useUpdate` hook.

_Note: This example demonstrates how `react-hook-form` works internally._

```jsx
const updateReducer = (num: number): number => (num + 1) % 1_000_000;

const useUpdate = () => {
  const [, update] = useReducer(updateReducer, 0);

  return update;
}

// Large form
// This is how react-hook-form works, in a nutshell
const Form: FC = () => {
  const formRef = useRef();

  if (!formRef.current) {
    formRef.current = {
      name: "",
      surname: "",
      // ...many fields
    };
  }

  const update = useUpdate();

  const register = useCallback((input) => {
    input?.addEventListener(
      "input",
      () => (formRef.current[input.name] = input.value)
    );
  }, []);

  const submit = useCallback(
    (event) => {
      event.preventDefault();
      // triggers update and renders the form data
      update();
    },
    [update]
  );

  return (
    <form onSubmit={submit}>
      <div>Form Data: {JSON.stringify(formRef.current)}</div>
      <input name="name" ref={register} />
      <input name="surname" ref={register} />
      // ...many fields
      <input type="submit" />
    </form>
  )
}
```

<iframe src="https://codesandbox.io/embed/large-form-update-uskuh?fontsize=14&hidenavigation=1&theme=dark"
  style="width:100%; max-width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden; box-shadow:rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;"
  title="large-form-update"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>> "Wisdom comes from experience. Experience is often a result of lack of wisdom." ― Terry Pratchett

There might sometimes be some small improvements or tricks that you can do to improve either the project itself or your development experience. The recipes section contains such tricks.

Some of them might seem obvious, others are here based on years of experience - both with specific stacks/libs and development in general.
Do not use `useMemo` as a semantic guarantee that it will be a constant throughout component re-renders

If you need a value to stay the same throughout re-renders, you might think of `useMemo` as a nice way to "mimic" a constant. While it might seem that way, [it is not guaranteed](https://react.dev/reference/react/useMemo#preventing-an-effect-from-firing-too-often).

> **You may rely on useMemo as a performance optimization, not as a semantic guarantee.** In the future, React may choose to “forget” some previously memoized values and recalculate them on next render, e.g. to free memory for off-screen components. Write your code so that it still works without useMemo — and then add it to optimize performance when it's necessary.

```jsx
// BAD
export const MyComponent: FC = () => {
  const id = useMemo(() => generateId(), []); // Not guaranteed to be a constant

  // ...
}
```

The best approach is to use lazy initialization:

```jsx
// GOOD
export const MyComponent: FC = () => {
  const [id, _] = useState(() => generateId()); // Initial value will stay the same throughout re-renders

  // ...
}
```

You can also store the value in a ref:

```jsx
type Result<T> = { v: T };

function useConstant<T>(fn: () => T): T {
  const ref = useRef<Result<T>>();

  if (!ref.current) {
    ref.current = { value: fn() };
  }

  return ref.current.value;
}

export const MyComponent: FC = () => {
  const id = useConstant(() => generateId());

  // ...
}
```

_Note: updating ref values will not trigger a re-render, and they should never be used inside hook like useEffect, useCallback or useMemo dependency arrays._

If you'll ever need to update the ref value, it's crucial to avoid modifying the .current property during the render phase. For example in Concurrent Mode, React may invoke the render function multiple times without committing the result, leading to potential inconsistencies if refs are modified during rendering.

For example, consider the following ["Latest ref pattern"](https://www.epicreact.dev/the-latest-ref-pattern-in-react) pattern:

```jsx
const callbackRef = React.useRef(callback);

React.useLayoutEffect(() => {
	callbackRef.current = callback;
});
```

In this pattern, callbackRef is initialized with the callback function. The useLayoutEffect hook updates callbackRef.current after each render, ensuring it always holds the latest callback without causing re-renders. This approach is safe in Concurrent Mode because the ref is updated outside the render phase.

In summary, while useRef is reliable for storing persistent values, ensure that any updates to the ref's .current property occur outside the render phase to maintain consistency and prevent potential issues.

## What is NextAuth?

[NextAuth](https://next-auth.js.org/) is an open-source authentication library designed specifically for Next.js applications. It streamlines adding authentication to your projects by providing a robust, flexible, and secure solution that integrates directly with Next.js API routes and pages. With built-in support for popular OAuth providers, email/passwordless login, and custom credential systems, NextAuth makes it easier to implement Single Sign-On (SSO) and other authentication patterns without reinventing the wheel.

It simplifies authentication by handling session management, token issuance, and secure communication between your client and server. It leverages Next.js’s file-based API routing to create endpoints (e.g., `/api/auth/[...nextauth]`) that manage sign-in, sign-out, and session verification automatically.

### How it works

- **Providers**: NextAuth supports a variety of authentication providers—OAuth (Google, GitHub, Facebook, etc.), email-based sign-ins, and custom credentials. This means you can easily integrate third-party SSO or build your own login flow.
- **Session Management**: Once authenticated, NextAuth creates a session that can be stored either in a JSON Web Token (JWT) or in a database-backed session store. The session object contains the user’s information and any additional claims you decide to include.
- **API Routes**: By utilizing Next.js API routes, NextAuth manages the authentication endpoints, handling tasks like token refresh, CSRF protection, and secure cookie management out-of-the-box.
- **Callbacks & Events**: NextAuth provides a variety of callbacks (e.g., for sign-in, JWT creation, session retrieval) that allow you to customize the authentication flow, such as adding custom claims or performing side effects like logging.

### Use cases

NextAuth can be used in various scenarios:

- **Single Page Applications**: Secure client-side rendered apps with minimal configuration.
- **Server-Side Rendering**: Integrate authentication in SSR workflows by accessing sessions on the server before rendering pages.
- **API Security**: Protect API routes by verifying sessions or JWT tokens.
- **Multi-Provider SSO**: Allow users to authenticate using their preferred identity provider (Google, GitHub, etc.) or via passwordless methods.

### Pros and Cons

**Pros**

- **Tailored for Next.js**: Seamless integration with Next.js features like API routes and SSR.
- **Out-of-the-box Security**: Comes with built-in protections (CSRF, secure cookie handling) that follow modern best practices.
- **Flexibility with Providers**: Supports many OAuth providers and custom credential systems.
- **Customizability**: Callbacks allow for tailoring the authentication flow, adding roles, or injecting additional user data.
- **Community and Documentation**: A vibrant community and extensive documentation make troubleshooting and customization straightforward.

**Cons**

- **Opinionated**: NextAuth makes certain assumptions about the authentication flow, which may not fit all use cases. Highly customized workflows might require additional work.
- **Next.js Centric**: While excellent for Next.js, its design does not lend itself well to non-Next.js projects.
- **Abstraction Overhead**: For very simple projects, using NextAuth might feel like overkill compared to implementing minimal custom logic.
- **Complexity in Advanced Scenarios**: Advanced use cases (like intricate multi-tenant setups) can lead to more complex configurations and potential gotchas.

## Basic Setup

### Installation

Install NextAuth and any necessary provider packages:

```bash
pnpm add -E next-auth
```

> If you’re using a specific provider (e.g., Google), make sure to install any required packages as outlined in the [NextAuth Providers documentation](https://next-auth.js.org/providers/).

### Secret Key

In order to automatically generate an example `AUTH_SECRET` in your `.env.local` file, you can run:

```bash
pnpx auth secret
```

> ⚠️ Warning! For Production environments make sure you're using ASYMMETRIC `RS256` 3072-bit key - you can read more about Security of JWT [here](https://cyberpolygon.com/materials/security-of-json-web-tokens-jwt/). If you want to hide the data inside token, use `JWE`.

### Configuration

Create configuration file at `/lib/auth.ts` - include which providers you want to use and any session settings.

```ts
import { getServerSession as getNextAuthServerSession, NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
// ...import any other providers or config as needed

export const authOptions: NextAuthOptions = {
	providers: [
		GitHubProvider({
			clientId: process.env.GITHUB_ID || '',
			clientSecret: process.env.GITHUB_SECRET || '',
		}),
		// ...add more providers here
	],
	// You can choose between JWT or DB sessions
	session: { strategy: 'jwt' }, // (default strategy)

	// callbacks let you customize or enrich the session
	callbacks: {
		async session({ session, token, user }) {
			// e.g. attach a "role" to the session
			//   session.user.role = user.role;
			return session;
		},
	},
	// ...more NextAuth configuration
};

// For better reusability, encapsulate the session logic in a separate hook
export const getServerSession = () => getNextAuthServerSession(authOptions);
```

### Authentication endpoint

Create a route handler at `/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

## Using NextAuth in components

### Client components

You can consume the session in your client components using `next-auth/react` hooks.

```jsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function HomePage() {
	const { data: session, status } = useSession();

	if (status === 'loading') {
		return <p>Loading...</p>;
	}

	if (session) {
		return (
			<div>
				<p>Signed in as {session.user?.email}</p>
				<button onClick={() => signOut()}>Sign out</button>
			</div>
		);
	}

	return (
		<div>
			<p>You are not signed in.</p>
			<button onClick={() => signIn('github')}>Sign in with GitHub</button>
		</div>
	);
}
```

### Server Components

In Server Components (or server-side logic), you can use `getServerSession` from `next-auth` to ensure data is fetched only for authenticated users.

```jsx
import { getServerSession } from '@/lib/auth';

export default async function DashboardPage() {
	const session = await getServerSession();

	if (!session) {
		// You can redirect or throw an error
		return <div>Please sign in to access your dashboard.</div>;
	}

	return <div>Welcome to the dashboard, {session.user?.name}!</div>;
}
```

## Best practices & gotchas

1. Use HTTPS Everywhere
   - Always serve your app over HTTPS to ensure secure cookie transmission.
2. Secure Cookies
   - By default, NextAuth sets httpOnly, sameSite cookies. Keep these settings to limit XSS/CSRF attack vectors.
3. Token Rotation
   - If you enable JWT sessions, consider token rotation or refresh tokens for better security.
4. Custom Callbacks
   - Enrich the session object with user roles or data.
   - Map external provider data to your custom user fields.
   - Handle token rotation or advanced encryption logic.
5. Stay Up to Date
   - NextAuth is actively developed. Watch the [changelog](https://github.com/nextauthjs/next-auth/releases) for new features and security updates.

### Gotchas

1. Route Handlers vs. Pages
   - If you used older patterns (e.g., `/pages/api/auth/\[...nextauth].ts`), switch to App Router route handlers.
2. Database Requirements
   - If you use a database session strategy, make sure the schema is set up (NextAuth can generate it for certain DBs).
3. Provider Rate Limits
   - Social providers might rate-limit logins if you do lots of short-interval sign-ins.
4. CSRF and Custom Forms
   - Credential-based sign-ins require anti-CSRF tokens, which NextAuth handles automatically, but be cautious if you implement fully custom forms.
5. Deploying on Serverless
   - NextAuth works on platforms like Vercel seamlessly, but if you use custom serverless hosts, check for any environment-specific limitations.

## NextAuth + CASL

[CASL](https://casl.js.org/v6/en/) is a popular library for Role/Permission-based Access Control. It defines “abilities” that specify what a user can or cannot do in your application. Typically, you’d combine your authentication solution (who is the user? are they logged in?) with an authorization layer (what is the user allowed to do?).

You can combine CASL and NextAuth together, because they serve different purposes:

- **NextAuth**: Authenticates a user, creates a session, provides user identity data.
- **CASL**: Defines abilities (permissions/roles) based on that user’s data or role.

### Configuring CASL with NextAuth

**Install dependencies**

```bash
pnpm add -E @casl/ability @casl/react
```

**Add roles to the session**

In NextAuth, use the `callbacks.session` function to add user roles or permissions into the session object. For example:

```ts
async session({ session, user }) {
  session.user.role = user.role;
  return session;
},
```

**Define abilities with CASL**

```ts
// lib/casl.ts
import { AbilityBuilder, Ability } from '@casl/ability';

export default function defineAbilitiesFor(user) {
	const { can, cannot, build } = new AbilityBuilder(Ability);

	if (user.role === 'admin') {
		can('manage', 'all');
	} else {
		can('read', 'Post');
		can('delete', 'Post', { authorId: user.id }); // Only allow deleting own posts
		cannot('delete', 'Post').unless({ authorId: user.id }); // Prevent deleting others' posts
		// etc.
	}

	return build();
}
```

**Use the session**

When a user logs in via NextAuth, call `defineAbilitiesFor(session.user)` to create a CASL “ability” instance. Then check permissions in your components, API routes, or server logic.

### Example real-world configuration:

> Remember to add the `[...nextauth]` route handler before the rest of configuration files!

**CASL config**:

```ts
// lib/casl.ts
import { AbilityBuilder, PureAbility } from '@casl/ability';

type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';
type Subjects = 'Users' | 'Posts' | 'all'; // Example domain models

export type AppAbility = PureAbility<[Actions, Subjects]>;

export function defineAbilitiesFor(params: { role: string; userId: string }) {
	const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);

	const { role } = params;

	if (role === 'admin') {
		// Admin can do everything
		can('manage', 'all');
	} else if (role === 'editor') {
		can('read', 'Posts');
		can('create', 'Posts');
		can('update', 'Posts');
		cannot('delete', 'Posts');
	} else {
		// role === "user"
		can('read', 'Posts');
		cannot('create', 'Posts');
		cannot('delete', 'Posts');
		// etc.
	}

	return build();
}
```

**NextAuth config**:

```ts
// lib/auth.ts
import { getServerSession as getNextAuthServerSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const MOCK_USER = {
	id: '1',
	name: 'John Doe',
	email: 'john@example.com',
	hashedPassword: 'hashedPassword',
	role: 'user',
};

const findUserByEmail = async (_email: string) => {
	return MOCK_USER;
};
const verifyPassword = async (_password: string, _hashedPassword: string) => {
	return true;
};

export const authOptions: NextAuthOptions = {
	session: {
		strategy: 'jwt',
	},
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials, req) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Missing username or password');
				}

				const user = await findUserByEmail(credentials.email);
				if (!user) {
					// Remember to never leak if there's actually a user with given email, always show the end-user "Invalid password" error!
					throw new Error('User not found');
				}

				const isValid = await verifyPassword(credentials.password, user.hashedPassword);
				if (!isValid) {
					throw new Error('Invalid password');
				}

				// Return a "safe" user object. NextAuth will store this in JWT token
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					// User role used by CASL
					role: user.role,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			// If `user` is defined, it means we're in the process of the user signing in
			if (user) {
				token.user = user;
			}
			return token;
		},
		async session({ session, token }) {
			// Add the user role to the session for CASL
			if (session.user && token) {
				session.user = token.user;
			}
			return session;
		},
	},
	// Optionally, add pages if you want custom error or signIn pages
	// pages: {
	//   signIn: '/login',
	//   error: '/login?error=CredentialsSignin', // example
	// },
};

// For better reusability, encapsulate the session logic in a separate hook
export const getServerSession = () => getNextAuthServerSession(authOptions);
```

**Typescript [Module Augmentation](https://next-auth.js.org/getting-started/typescript#module-augmentation)**:

Create `src/typings/next-auth.d.ts` file:

```ts
/// <reference types="next-auth" />

import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

type AppUser = DefaultUser & {
	id: string;
	name: string;
	email: string;
	role: string;
};

declare module 'next-auth' {
	interface User extends AppUser {
		// Strictly override the base type "string | null | undefined" with "string"
		name: string;
		email: string;
	}

	interface Session extends DefaultSession {
		user: AppUser;
	}
}

declare module 'next-auth/jwt' {
	interface JWT extends DefaultJWT {
		user: AppUser;
	}
}
```

**Example server component**:

```jsx
import { getServerSession } from '@/lib/auth';
import { defineAbilitiesFor } from '@/lib/casl';

export default async function DashboardPage() {
	const session = await getServerSession();

	if (!session?.user) {
		return <div>Please sign in first.</div>;
	}

	const ability = defineAbilitiesFor({
		role: session.user.role,
		userId: session.user.id,
	});

	// Example usage
	const canCreatePost = ability.can('create', 'Posts');

	return (
		<div>
			<h1>Welcome, {session.user.name}!</h1>
			<p>Your role: {session.user.role}</p>

			{canCreatePost ? (
				<div>Show "Create Post" button or form here.</div>
			) : (
				<p>You do not have permission to create posts.</p>
			)}
		</div>
	);
}
```

**Example client component**:

```jsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
	const { data: session, status } = useSession();
	const [credentials, setCredentials] = useState({ email: '', password: '' });

	if (status === 'loading') {
		return <p>Loading...</p>;
	}

	if (session) {
		return (
			<div>
				<p>Signed in as {session.user.email}</p>
				<p>Your role is: {session.user.role}</p>
				<button onClick={() => signOut()}>Sign out</button>
			</div>
		);
	}

	return (
		<form>
			<label>
				Email
				<input
					type="email"
					value={credentials.email}
					onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
				/>
			</label>
			<label>
				Password
				<input
					type="password"
					value={credentials.password}
					onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
				/>
			</label>
			<button
				type="submit"
				onClick={(e) => {
					e.preventDefault();
					signIn('credentials', {
						email: credentials.email,
						password: credentials.password,
					});
				}}
			>
				Sign in
			</button>
		</form>
	);
}
```

**Example route handler**:

```ts
// app/api/protected-resource/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { defineAbilitiesFor } from '@/lib/casl';

export async function GET() {
	const session = await getServerSession();

	if (!session?.user) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	const ability = defineAbilitiesFor({
		role: session.user.role,
		userId: session.user.id,
	});

	// For example, we check if the user can "read" a "Post"
	if (!ability.can('read', 'Posts')) {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}

	// Otherwise, proceed with returning the resource
	return NextResponse.json({ message: 'Here is the protected data' });
}
```

## Motivation

With `next/font`, you can automatically optimize both custom and standard fonts, reducing external network requests for enhanced performance and privacy.

One notable advantage of `next/font` is its built-in self-hosting capability for any font file. Leveraging the CSS `size-adjust` property ([mdn](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust)), web fonts can be loaded optimally, eliminating any layout shift issues. Additionally, Next.js allows you to conveniently utilize [Google Fonts](https://fonts.google.com/) while prioritizing performance and privacy. During the build process, CSS and font files are downloaded and self-hosted alongside other static assets, eliminating the need for additional browser requests.

_More details can be found in the [Official NextJS Font Optimization documentation](https://nextjs.org/docs/basic-features/font-optimization)._

## Implementation

### Google Fonts

1. We import **ChakraProvider**, the **desired font _(e.g. Roboto)_** and our **theme** definition:

```javascript
// _app.tsx
import { ChakraProvider } from '@chakra-ui/react';
import { Roboto } from 'next/font/google';

import theme from '@/styles/theme';
...
```

2. We **define the font** with the desired [properties](https://nextjs.org/docs/app/api-reference/components/font):

```javascript
...
const roboto = Roboto({
	weight: ['400', '700'], // Required, unless using variable fonts
	style: ['normal', 'italic'], // Optional
	subsets: ['latin'], // Optional
	display: 'swap', // Optional
});
...
```

It is recommended to use [variable fonts](https://fonts.google.com/variablefonts#font-families). When using a variable font, we do **not** have to define the **weight** property.

> Good to know: Use an underscore (_) for font names with multiple words. E.g. Roboto Mono should be imported as Roboto_Mono.

3. We **extend our theme** by applying the font styles to our theme:

```javascript
...
theme.fonts.body = roboto.style.fontFamily;
theme.fonts.heading = roboto.style.fontFamily;
...
```

4. We use our modified theme and pass it to **ChakraProvider**:

```javascript
...
function App({ Component, pageProps, err }) {
	return (
		<ChakraProvider theme={theme}>
			<Component {...pageProps} err={err} />
		</ChakraProvider>
	);
}

export default App;
```

### Local Fonts

1. We import **ChakraProvider**, **localFont** and our **theme** definition:

```javascript
// _app.tsx
import { ChakraProvider } from '@chakra-ui/react';
import localFont from 'next/font/local';

import theme from '@/styles/theme';
...
```

2. We **define the font** with the desired [properties](https://nextjs.org/docs/app/api-reference/components/font):

```javascript
...
const gtHaptik = localFont({
	src: [
		{ path: '../assets/fonts/GT-Haptik-Regular.woff', weight: '400', style: 'normal' },
		{ path: '../assets/fonts/GT-Haptik-Bold.woff', weight: '700', style: 'normal' },
	],
});
...
```

3. We **extend our theme** by applying the font styles to our theme:

```javascript
...
theme.fonts.body = gtHaptik.style.fontFamily;
theme.fonts.heading = gtHaptik.style.fontFamily;
...
```

4. We use our modified theme and pass it to **ChakraProvider**:

```javascript
...
function App({ Component, pageProps, err }) {
	return (
		<ChakraProvider theme={theme}>
			<Component {...pageProps} err={err} />
		</ChakraProvider>
	);
}

export default App;
```

## Conclusion

By implementing font optimization techniques provided by Next.js, you can significantly improve the user experience of your website. The combination of efficient font loading and reduced external requests contributes to faster load times and improved privacy._React Concurrency_ introduces a new rendering model that allows React to be more intelligent about scheduling work on the main thread. This means React can:

- Pause rendering tasks if something more important arises (e.g., user input).
- Resume those tasks without losing progress.
- Discard or “skip” outdated renders when newer updates come in.

> 📌 Concurrency in React is not “multi-threading.” Everything still runs on one thread in the browser. It's about breaking work into chunks and prioritizing tasks so your app remains responsive.

> 📌 React 18 integrates concurrency by default - there is no separate “Concurrent Mode” like in earlier previews.

In day-to-day coding, you mostly see concurrency through:

- Transitions (`useTransition()`) for deferring non-urgent updates.
- _Suspense_ for data fetching or code-splitting, showing fallbacks while content loads.
- Streaming (SSR) in frameworks like Next.js, which lets you send partial HTML to the client.
- `useDeferredValue()` hook for deferring expensive calculations while user input remains smooth.

## Next.js concurrency

Next.js encourages usage of _Suspense_ and streaming by default, aligning well with concurrency principles, it has multiple benefits:

1. **Performance**: Concurrency prevents large synchronous renders from blocking the main thread. Even if the server is fetching data from multiple APIs, concurrency helps ensure faster hydration and responsive interactions.
2. **Scalability**: Large Next.js applications can break pages into smaller concurrent chunks. For example, a complex dashboard might fetch dozens of data sources in parallel using server components.
3. **Better User Experience**: By streaming content and managing priorities, your app can show partial results or skeleton UIs almost immediately, letting users start interacting faster.
4. **Partial SSR**: The server can start sending the page as soon as some parts are ready.
5. **Faster Interactions**: React can handle user input at higher priority, reducing input lag.
6. **Server-Client Synergy**: The concurrency model is shared across server and client boundaries, thanks to _React Server Components_ and Next.js's build pipeline.

## Key concurrency features

_Concurrency_ isn't a single feature, it's an umbrella term for _React 18_ capabilities that allow more fine-grained rendering control. Let's break down some highlights, then we'll add an extra detail about interruption and scheduling.

### Concurrent rendering

React can break rendering into multiple chunks and spread them out. Prior to React 18, an expensive render could block the browser from responding to user input. Now, React can:

- Pause mid-render.
- Perform a quick higher priority update (like a user typing).
- Resume the previously paused render.

In Next.js, concurrent rendering is used during both client-side transitions and server rendering. Although you don't “opt in” to concurrency specifically, you do need to be mindful of writing code that plays nicely with concurrent rendering. For instance, avoid side-effects that must complete in a single synchronous pass if not absolutely necessary.

### Suspense

_Suspense_ has become more powerful with concurrency, especially when combined with Next.js. It allows you to:

- Wrap components that need time to load (e.g., data fetching or lazy-loaded components).
- Show a fallback UI while the component is “pending”.
- Gracefully reveal the loaded component once it's ready, without blocking other parts of the UI.

For server components, _Suspense_ helps with streaming partial HTML, so the user doesn't stare at a blank screen. For client components, _Suspense_ can also be used for code-splitting or data fetching (via libraries that integrate with _Suspense_, such as _React Query_).

### Transitions and `useTransition()`

React’s concurrent rendering features allow you to differentiate between urgent (high-priority) updates—like direct user interactions—and transitional (lower-priority) updates—like recalculating large lists or re-fetching data in the background. This distinction helps keep your app feeling responsive by letting React schedule less urgent updates so that critical interactions (e.g., typing or clicking) don’t feel sluggish.

In Next.js 13 and beyond, concurrency is integrated into the framework’s new features like the App Router, Server Components, and streaming. Even if you’re not using all of these features, understanding concurrency principles and `useTransition()` can significantly improve both real and perceived performance.

**`useTransition()`**

The `useTransition()` hook allows you to mark certain state updates as lower priority so that React can handle them in the background. This hook returns a tuple:

```jsx
const [isPending, startTransition] = useTransition();
```

- `isPending`: A boolean that tells you whether a transition is currently in progress.
- `startTransition(updaterCallback)`: A function that wraps the state updates that can be deferred.

Any state updates inside the `startTransition()` callback are scheduled as transitions, giving React the freedom to pause or delay them so that urgent updates aren't blocked.

**Quick example**

If you have a complex search results component that re-renders whenever a user types into a filter box, it could cause the UI to lag. By wrapping the expensive logic within `startTransition()`, you allow React to treat the update as a lower-priority task. As a result, the user can continue typing without delays:

```jsx
"use client";

import React, { useState, useTransition } from "react";

const ALL_ITEMS = [
  "React",
  "React Native",
  "Next.js",
  "Vue.js",
  "Angular",
  "Svelte",
  "SolidJS",
  // ...imagine a very large dataset
];

function UseTransitionExamplePage() {
  // Synchronous input state
  const [inputValue, setInputValue] = useState("");

  // Transitional “filter” state
  const [filterQuery, setFilterQuery] = useState("");

  // The filtered results to display
  const [filteredItems, setFilteredItems] = useState(ALL_ITEMS);

  // useTransition gives us isPending + startTransition
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    // Always update the text input immediately
    setInputValue(newValue);

    // Defer the expensive filtering in a transition
    startTransition(() => {
      setFilterQuery(newValue);
      // Simulate a large or expensive filter operation
      const filtered = ALL_ITEMS.filter((item) =>
        item.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredItems(filtered);
    });
  }

  return (
    <div>
      <h2>Filter List with Transition</h2>
      <input
        value={inputValue} // Controlled input updates instantly
        onChange={handleChange}
        placeholder="Type to filter..."
      />
      {/* Show a subtle loading indicator if the transition is in progress */}
      {isPending && <p>Filtering in background...</p>}
      <ul>
        {filteredItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        <strong>Filter Query:</strong> {filterQuery}
      </p>
    </div>
  );
}

export default UseTransitionExamplePage;
```

In this snippet:

- `isPending` can be used to show a subtle loading indicator or spinner, signaling to the user that a background update (the transitional update) is still in progress.
- `inputValue` is updated synchronously on each keystroke, so the user sees their exact typing with no lag or delay.
- `startTransition()` groups filtering functionality under a less urgent priority, letting React keep the text input fully responsive. This drastically improves user experience for large or expensive components.

In summary, the user enjoys a responsive text field while React processes the filter operation. If the dataset is large, the UI won’t freeze during the recalculation.

**How Transitions Work Under the Hood**

When an update is wrapped in `startTransition()`, React treats it as non-blocking. Under concurrent rendering, React can break up rendering tasks into multiple chunks, pausing or “yielding” in between to handle more urgent tasks (like processing the user's next keystroke or click). This gives the user interface a multi-threaded feel, even though it's all running on a single JavaScript thread under the hood.

Under the default (synchronous) rendering model, once a rendering update begins, the browser can't do anything else until that render completes. With concurrent rendering, React uses an internal scheduler:

1. **Identify urgent updates**: User keystrokes, button clicks, toggles, etc.
2. **Identify transitional updates**: Large data recalculations, big table re-renders, graph drawing, etc.
3. **Allow interruption**: If a new urgent update arrives, React can pause the transitional render and handle the new update first.

This scheduling approach is at the heart of React's concurrency model and is what empowers the `useTransition()` hook to optimize your app's responsiveness.

**When to use `useTransition()`**

- You have large computations or heavy UI updates that don't need to block immediate user actions.
- You want to keep input or navigation highly responsive while background tasks execute.
- You need to fetch data or revalidate cache but don't want the user to feel lag in critical interactions. (Though for data fetching, you might combine `useTransition()` with other concurrency features like _Suspense_.)

**When to avoid `useTransition()`**

- The update is truly urgent (e.g., toggling a dropdown or a modal visibility). These require immediate updates; deferring them would make the UI feel broken.
- The update has minimal performance cost. If you can handle it synchronously without affecting responsiveness, you don't need concurrency overhead.
- You are implementing purely UI state that should update immediately for user feedback, such as a form field validation or a selection highlight.

### Streaming

_Streaming_ is a Next.js feature that complements concurrency by allowing the server to send partial responses as soon as they're ready. Instead of waiting for the entire page's data to be fetched, the server:

1. Starts generating HTML for the earliest content.
2. Streams that content to the client.
3. Continues rendering and sends subsequent chunks as they are ready, especially if you have multiple _Suspense_ boundaries.

This approach drastically improves the [time-to-first-paint](<https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming#:~:text=First%20Paint%20(FP)%3A%20Time%20when%20anything%20is%20rendered.%20Note%20that%20the%20marking%20of%20the%20first%20paint%20is%20optional%2C%20not%20all%20user%20agents%20report%20it.>) on complex pages. The user can start reading or interacting with loaded sections while slower data or deeper nested components finish fetching on the server.

### Interruption and Scheduling

Beyond _streaming_ and _Suspense_, the concurrency model also involves _scheduling_. Under the hood, React uses a cooperative scheduler:

1. It checks if there's any urgent work. If so, it interrupts ongoing rendering.
2. Once urgent work is handled (e.g., user typed a character), React goes back to the paused render.

For Next.js developers, you mostly see the benefits automatically. However, you can fine-tune how React schedules certain updates with `useTransition()` and other concurrency hooks (`useDeferredValue()`), ensuring your app remains snappy under heavy loads.

## Server Components and Concurrency

_React Server Components_ are a paradigm shift that let you run components entirely on the server. The server fetches data, compiles the resulting UI into a lightweight representation, and sends it to the client.

Concurrency helps in two key ways:

1. **Parallel Data Fetching**: The server can fetch multiple data sources concurrently, streaming partial results as soon as they're ready.
2. **Reduced Client Overhead**: Because _RSC_ logic is not bundled to the client, concurrency ensures minimal blocking on the client side.

This synergy means large server-side computations don't freeze the user's browser, and concurrency can schedule these computations in parallel, further reducing overall load time.

### Concurrency in the App Router

In the App Router:

- Each route can have its own `page.tsx`, `layout.tsx`, `loading.tsx`, and `error.tsx`.
- Concurrency ensures that if multiple route segments are loading at once, React can handle them in parallel or interrupt them if higher-priority tasks come in.
- Suspense boundaries can be placed at any layer, allowing partial streaming and partial hydration.

For example, you could have a `layout.tsx` that fetches top-level data about a user's profile, while a nested route fetches more detailed info. Both can render concurrently, with partial results streaming to the client as they're ready.

### Error Boundaries

_Error Boundaries_ are React components (or special Next.js files like `error.tsx`) that catch errors in the render tree below them. In concurrent mode:

- If an error occurs during a partially completed render, React can discard that partial output and switch to the error boundary.
- This prevents a single data-fetching error from crashing your entire page or layout.
- Concurrency ensures the rest of the UI that's error-free remains interactive and unaffected.

### Combining Error Boundary with Suspense

When you combine _Error Boundaries_ with _Suspense_:

- If data is “pending,” you see the `<Suspense>` fallback (e.g., a spinner or skeleton).
- If an error occurs, you see the error boundary fallback (e.g., a friendly error message or “try again” button).
- This layered approach ensures the user always sees something, rather than a blank or broken screen. Coupled with concurrency, your app can remain stable under partial failures and can quickly recover without forcing a full page reload.

### Summary

You may be wondering what does all of this give me in practice... In day-to-day usage, you might not always be aware that concurrency is happening behind the scenes, but _React Concurrency_ most often shows up in three main areas:

1. Data Fetching and Streaming
   - When you fetch data for a page or component (especially a _React Server Component_ in the `app/` directory), Next.js can begin sending HTML to the client as soon as part of the data is ready. This means users can start seeing and interacting with certain parts of the page almost immediately, rather than waiting for the entire payload.
   - You'll often place `<Suspense>` boundaries around components that need to fetch data. Next.js will show a `loading.tsx` (or your own custom fallback) while the data is being fetched, and then “stream” in the final component once it's done.
2. Smoother UI Updates with Transitions
   - On the client side, if you have expensive or complex state updates (for example, filtering a large list or re-rendering a big table), concurrency ensures that user interactions (like typing in a text box) don't get blocked by rendering work.
   - You'll use `useTransition()` in your client components to mark certain updates as “transitions,” telling React that it's okay to do the heavy rendering in the background while keeping the UI responsive.
3. _Partial Rendering_ and _Error Boundaries_
   - Because React can pause and resume rendering, you can design your app so that if one part of the page is slow or errors out, it won't break the rest of the page.
   - You'll place _Error Boundaries_ (or define `error.tsx` in the App Router) and _Suspense Boundaries_ around sections of your layout or page that may fail or take longer to render. This way, Next.js and React can gracefully handle slow or failing sections without freezing or crashing the whole app.

## Recipes & Code Snippets

### Combining `useDeferredValue()` with _Suspense_

`useDeferredValue()` is another concurrency hook that defers updating a value until after more urgent updates have been processed. Unlike `useTransition()`, which defers state updates, `useDeferredValue()` defers the consumption of a value.

```jsx
// app/search/page.tsx

import { Suspense } from "react";
import SearchClient from "./_components/SearchClient";
import SearchResults from "./_components/SearchResults";

interface SearchPageProps {
  searchParams?: Promise<{ q?: string }>;
}

// A Server Component: Orchestrates our client input + server-side results.
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (await searchParams)?.q ?? ""; // Fall back to empty string if no query

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Search Example</h1>

      {/* Client Component for user input and deferred query updates */}
      <SearchClient initialQuery={query} />

      {/* Suspense boundary: shows fallback while server fetch is in progress */}
      <Suspense key={query} fallback={<p>Loading results...</p>}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
```

```jsx
// app/search/_components/SearchClient.tsx

"use client";

import React, { useState, useDeferredValue, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchClientProps {
  initialQuery: string;
}

export default function SearchClient({ initialQuery }: SearchClientProps) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(localQuery);

  const router = useRouter();

  // Whenever the deferred query stabilizes, update the URL (triggering a server re-fetch)
  useEffect(() => {
    // Only push/replace if there's an actual change from the initial query
    if (deferredQuery !== initialQuery) {
      router.replace(`/search?q=${encodeURIComponent(deferredQuery)}`);
    }
  }, [deferredQuery, initialQuery, router]);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        value={localQuery}
        placeholder="Type to search..."
        onChange={(e) => setLocalQuery(e.target.value)}
        style={{ padding: "0.25rem", width: "250px" }}
      />
    </div>
  );
}
```

> Note: For typical server-powered search, manual debouncing or throttling is usually more practical, because `useDeferredValue` alone does not reduce how often the server is called - it only defers rendering on the client. If your main goal is to prevent frequent network requests, consider a debounce approach.

```jsx
// app/search/_components/SearchResults.tsx

import { use } from "react";
import { ALL_ITEMS } from "../_data/items";

// Simulate a slightly slow operation (1 second) to let Suspense display fallback
async function filterItems(query: string) {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
  const lower = query.toLowerCase();

  return ALL_ITEMS.filter((item) => item.toLowerCase().includes(lower));
}

interface SearchResultsProps {
  query: string;
}

// A Server Component that fetches/filters data and returns the result
export default function SearchResults({ query }: SearchResultsProps) {
  const results = use(filterItems(query));

  // If the query is empty, we could optionally show an empty state or all items
  if (!query.trim()) {
    return <p>Please type a query to begin searching.</p>;
  }

  if (results.length === 0) {
    return <p>No items found for "{query}"</p>;
  }

  return (
    <ul>
      {results.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}
```

```ts
// app/search/_data/items.ts

// Just an example: 5000 items
export const ALL_ITEMS = Array.from({ length: 5000 }).map((_, i) => `Item ${i + 1}`);
```

1. `useDeferredValue()`: Great for local, client-side concurrency. It helps keep typing smooth, but doesn’t automatically reduce server calls. Real-world apps often combine it with a manual debounce or throttle for fewer network requests.
2. _Suspense_: Perfect for handling async data in Next.js server components. Users see a fallback while your code “suspends” to fetch or filter data.
3. `key={query}`: Forces React to remount the Suspense boundary each time the query changes, guaranteeing a fallback if the data truly suspends.
4. _Artificial Delays_: Commonly used in examples to illustrate concurrency, since truly instant data fetches wouldn’t show the fallback otherwise.

In short, this example merges concurrency (deferred input updates) on the client with a Suspense-based server fetch. The user’s typing is uninterrupted, and if the server fetch is slow, the fallback UI is displayed until the result is ready

### Coordinating Concurrency with animations

If your app has animations (e.g., using _React Transition Group_ or a CSS-based approach), heavy renders can cause janky animations. With concurrency, you can:

- Use `useTransition()` to defer expensive state changes that might slow down the main thread.
- Let the animation run at higher priority.

```jsx
'use client';

import { useTransition, useState } from 'react';
import styles from './FadingBox.module.css'; // some .fadeIn or .fadeOut

export default function AnimatedBox() {
	const [isPending, startTransition] = useTransition();
	const [boxCount, setBoxCount] = useState(0);
	const [animate, setAnimate] = useState(false);

	function handleAddBoxes() {
		// Start a high-priority animation
		setAnimate(true);

		// Defer the expensive creation of multiple boxes
		startTransition(() => {
			setBoxCount((count) => count + 10_000); // big set of boxes for demonstration
		});

		// Reset the animation after it's done
		setTimeout(() => setAnimate(false), 500); // or use CSS transitionend event
	}

	const boxes = Array.from({ length: boxCount }, (_, i) => <div key={i} className={styles.box} />);

	return (
		<div>
			<button onClick={handleAddBoxes} disabled={isPending}>
				{isPending ? 'Adding...' : 'Add More Boxes'}
			</button>

			<div className={animate ? styles.fadeIn : ''}>{boxes}</div>
		</div>
	);
}
```

```css
/* /FadingBox.module.css */

/* A simple fade-in animation */
@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

/* When applied, fadeIn animates the container from 0 to full opacity */
.fadeIn {
	animation: fadeIn 0.5s forwards ease-in;
}

/* Basic styling for each "box" we add */
.box {
	width: 20px;
	height: 20px;
	background-color: tomato;
	display: inline-block;
	margin: 3px;
}
```

1. Clicking “_Add More Boxes_” triggers an immediate animation (`setAnimate(true)`) for the container.
2. The huge `setBoxCount((c) => c + 10000)` is wrapped in `startTransition()`. If you had frequent re-renders, concurrency would slice the rendering work so the fade animation remains smooth.
3. After 500ms, `setAnimate(false)` stops the animation class.

### Offscreen Rendering with Concurrency (Experimental)

> Recently "Offscreen" was renamed to "Activity", you can read more about this in the [React Blog](https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024#offscreen-renamed-to-activity). Remember that it's still an experimental feature in React. If you're comfortable with experimental APIs, you can demonstrate concurrency by rendering a component “offscreen” and revealing it later without re-rendering.

```jsx
'use client';

import React, { Offscreen } from 'react';
import { SomeExpensiveComponent } from './SomeExpensiveComponent';

export default function OffscreenDemo() {
	const [isVisible, setIsVisible] = React.useState(false);

	return (
		<>
			<button onClick={() => setIsVisible(!isVisible)}>Toggle Expensive Component</button>
			<Offscreen mode={isVisible ? 'visible' : 'hidden'}>
				<SomeExpensiveComponent />
			</Offscreen>
		</>
	);
}
```

1. In “hidden” mode, `SomeExpensiveComponent` is still mounted in memory but not painted to the screen.
2. When toggling to “visible,” the component appears instantly, without re-running its expensive setup.
3. React uses concurrent rendering to manage this show/hide without blocking the main thread.

## Best Practices & Common Pitfalls

8. Over-Suspending Your App
   - Placing a `<Suspense>` boundary around every tiny component can lead to multiple fallbacks popping in and out. This can degrade the user experience by showing too many loading spinners or skeletons. Instead, group logically-related components under one boundary so they either load together or stay hidden together.
9. Underestimating Error Boundaries
   - In concurrent rendering, errors can appear more frequently in partial or “in-progress” states.
   - If you lack error boundaries, your entire app might go down with a single data-fetching mistake. Always place error boundaries around components that are more prone to fetch or rendering errors.
10. Transition Overuse
    - Not all updates need to be transitions. For example, real-time text input in a small form shouldn't be deferred. Users expect immediate feedback.
    - Overusing transitions can make your app feel sluggish because you're telling React it can “wait” to process certain updates.
11. Large CPU-Bound Operations
    - Concurrency doesn't introduce actual multi-threading. It splits tasks into chunks, but if you have massive computations (e.g., cryptographic hashing, large image processing), they can still block the main thread. Consider offloading such tasks to Web Workers or the server.
12. Testing Complexity and Timings
    - Concurrency can introduce subtle timing and state issues that didn't exist in synchronous mode.
    - Use _React Testing Library_ and fake timers or libraries like _Mock Service Worker_ to carefully test asynchronous states.
    - Be aware that transitions and streaming might require integration tests or end-to-end tests to ensure the final user experience is correct.
13. Security and Data Consistency
    - Since concurrency can interleave fetches, ensure you're handling secure data carefully.
    - If you rely on user sessions or tokens, confirm that partial renders don't leak data across boundaries or to unauthorized users.
    - On the server side, concurrency might call multiple APIs in parallel. Make sure your data dependencies don't cause race conditions or partial data merges.

### Race Conditions

Server Components in Next.js fetch data on the server and return serialized component trees to the client. Under concurrency, multiple fetches and renders can occur in parallel. If multiple parallel fetches modify or depend on the same shared resource (like an in-memory store or a global variable), you might end up with inconsistent data or unexpected overwrites.

Concurrency means React can trigger different parts of the component tree simultaneously (especially with _Suspense boundaries_), so if your server logic isn't idempotent or thread-safe, parallel requests might conflict.

⚠️ Example:

```jsx
// app/(dashboard)/_components/SomeServerComponent.tsx
const inMemoryCache: {
  lastRender: number | null;
  [key: string]: any;
} = {
  lastRender: null,
}; // Shared mutable object

export default async function SomeServerComponent() {
  // Suppose each render modifies a global inMemoryCache
  // Two concurrent requests could clash or overwrite data
  inMemoryCache['lastRender'] = Date.now();

  const data = await fetch('https://api.example.com/data').then((res) => res.json());
  inMemoryCache[data.id] = data; // Possibly overwritten by another request in parallel

  // Render the updated data
  return (
    <>
      <p>Data for {data.id}</p>
      <p>Last Render Time: {inMemoryCache['lastRender']}</p>
    </>
  );
}
```

### Zombie UI states

A “_Zombie UI_” state happens when an old, outdated effect or render finishes after a newer update has already been applied, causing older data to overwrite the fresh data. It's like a zombie rising back up and undoing your latest changes.

React discards outdated renders when it knows they're obsolete, but certain side-effects or external subscriptions might not be properly canceled if the component code doesn't account for concurrency. A typical scenario is where an older effect finishes after the newer effect is already rendered.

⚠️ Example:

```jsx
// app/products/page.tsx
import ProductsFilter from './_components/ProductsFilter';

export default function ProductsPage() {
	return (
		<main style={{ padding: '1rem' }}>
			<h1>Zombie UI Concurrency Example</h1>
			{/* Client-side filter input + product list */}
			<ProductsFilter />
		</main>
	);
}
```

```ts
// app/products/actions.ts

// Simulate a large product database
const ALL_PRODUCTS = [
	{ id: 1, title: 'Laptop' },
	{ id: 2, title: 'Camera' },
	{ id: 3, title: 'Headphones' },
	{ id: 4, title: 'Smartphone' },
	{ id: 5, title: 'Tablet' },
	{ id: 6, title: 'Smartwatch' },
	{ id: 7, title: 'TV' },
	{ id: 8, title: 'Gaming Console' },
	{ id: 9, title: 'External Hard Drive' },
	{ id: 10, title: 'Monitor' },
	{ id: 11, title: 'Printer' },
	{ id: 12, title: 'Keyboard' },
	{ id: 13, title: 'Mouse' },
	{ id: 14, title: 'Desk' },
	{ id: 15, title: 'Office Chair' },
	{ id: 16, title: 'Webcam' },
	{ id: 17, title: 'Microphone' },
	{ id: 18, title: 'USB Hub' },
	{ id: 19, title: 'Router' },
	{ id: 20, title: 'Smart Home Device' },
	{ id: 21, title: 'Drone' },
	{ id: 22, title: 'Projector' },
	{ id: 23, title: 'Digital Camera' },
	{ id: 24, title: 'Action Camera' },
	{ id: 25, title: 'Fitness Tracker' },
	{ id: 26, title: 'External SSD' },
	{ id: 27, title: 'Camera Lens' },
	{ id: 28, title: 'Tripod' },
	{ id: 29, title: 'Camera Bag' },
	{ id: 30, title: 'Gimbal' },
	// ... potentially hundreds more
];

// This server action is intentionally slow to illustrate concurrency
export async function fetchFilteredProducts(filter: string) {
	// Simulate slow fetching (~1-2 seconds)
	const timeout = Math.random() * 1000 + 1000;

	console.log(`Fetching products for filter ${filter} with timeout ${timeout}ms`);

	await new Promise((resolve) => setTimeout(resolve, timeout));

	// Basic filter
	const lower = filter.toLowerCase();
	const filtered = ALL_PRODUCTS.filter((p) => p.title.toLowerCase().includes(lower));

	return filtered;
}
```

```jsx
// app/products/_components/ProductsFilter.tsx

"use client";

import React, { useState, useTransition } from "react";
import { fetchFilteredProducts } from "../actions"; // Import server action

export default function ProductsFilter() {
  const [filter, setFilter] = useState("");
  const [products, setProducts] = useState<{ id: number; title: string }[]>([]);
  const [isPending, startTransition] = useTransition();

  // We'll store a "requestId" to illustrate how zombie updates happen
  let requestIdCounter = 0;

  async function handleFilterChange(newFilter: string) {
    setFilter(newFilter);

    // We generate a unique ID for this request
    const currentRequestId = ++requestIdCounter;

    // Mark the fetch as a transition (Concurrency!). React can interrupt, reorder, etc.
    startTransition(async () => {
      const result = await fetchFilteredProducts(newFilter);

      // ZOMBIE PITFALL: If this older fetch finishes last, it overwrites newer results
      // We do not guard against that, so let's illustrate what can happen:
      console.log(
        `[Request ${currentRequestId}] Filter "${newFilter}" => ${result.length} products`
      );

      // Overwrites state, even if a newer request has completed
      setProducts(result);
    });
  }

  return (
    <section>
      <h2>Client-Side Filter (Concurrency)</h2>
      <input
        type="text"
        placeholder="Search products..."
        value={filter}
        onChange={(e) => handleFilterChange(e.target.value)}
        style={{ marginBottom: "0.5rem" }}
      />
      {isPending && <p>Loading filtered products...</p>}

      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </section>
  );
}
```

**How the Zombie occurs**

1. User types "cam" (request #1).
2. Before it finishes, they continue typing "camera" (request #2).
3. Concurrency means React can run both fetch calls in parallel or partial sequence.
4. If request #2 returns first, we set products to `["Camera", "Digital Camera", "Action Camera", "Camera Lens", "Camera Bag"]`.
5. Then request #1 finishes last (zombie!). It calls `setProducts(...)` with results for "cam" — overwriting the correct array with additional `Webcam` product.

Zombie updates did exist before concurrency, but concurrency increases their frequency and can reorder them in ways old React rarely did, making it a bigger pitfall if you don't handle stale requests carefully. In older React (pre-React 18), if the user typed quickly, the browser often wouldn't allow an overlapping render or partial updates mid-SSR. The UI might block or become unresponsive, making it less likely to see such a neat out-of-order scenario.

**Fixing the Zombie Issue**

To prevent the outdated fetch from overwriting fresh data, we can:

1. Track a local `requestId`.
2. Abort older requests if concurrency or user input changes.
3. Check if the request is “still valid” before calling `setProducts()`.

✅ Example:

```jsx
// app/products/_components/ProductsFilter.tsx

"use client";

import React, { useState, useTransition, useRef } from "react";
import { fetchFilteredProducts } from "../actions";

/**
 * Demonstrates preventing zombie updates by using an imperative requestIdRef.
 * Each new request increments the ref. The async callback only updates state
 * if the requestId matches the ref's current value.
 */
export default function ProductsFilter() {
  const [filter, setFilter] = useState("");
  const [products, setProducts] = useState<{ id: number; title: string }[]>([]);

  // A ref that tracks the "latest" request ID. We'll increment this each time
  // the user triggers a new fetch.
  const requestIdRef = useRef(0);

  // For concurrency: we mark fetch updates as transitions.
  const [isPending, startTransition] = useTransition();

  // Handler for typing in the filter input
  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);

    // 1) Increment the requestIdRef to represent a brand-new request
    requestIdRef.current += 1;
    const localRequestId = requestIdRef.current;

    // 2) Start a concurrent fetch
    startTransition(async () => {
      const result = await fetchFilteredProducts(newFilter);

      // 3) After the fetch, check if requestIdRef is still the same
      if (localRequestId === requestIdRef.current) {
        console.log(
          `%cRequest #${localRequestId} is the latest, updating products`,
          "color: green;"
        );
        setProducts(result);
      } else {
        console.log(
          `%c[Zombie Prevented] Request #${localRequestId} is stale`,
          "color: orange;"
        );
      }
    });
  }

  return (
    <section>
      <h2>Client-Side Filter (Concurrency, Zombie-Safe via Ref)</h2>
      <input
        type="text"
        placeholder="Search products..."
        value={filter}
        onChange={(e) => handleFilterChange(e.target.value)}
        style={{ marginBottom: "0.5rem" }}
      />

      {isPending && <p>Loading filtered products...</p>}

      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </section>
  );
}
```

**Why this is just a demonstration**

You may be wondering why `AbortController` isn't used in the zombie UI fix example... The reason lies in the nature of Next.js Server Actions, which are fundamentally different from standard network requests like `fetch`.

Server Actions operate as a special [“RPC-like” mechanism](<https://scastiel.dev/simplest-example-server-actions-nextjs#:~:text=If%20you%20are%20familiar%20with%20distributed%20computing%20patterns%2C%20you%20can%20notice%20that%20server%20actions%20offer%20a%20remote%20procedure%20call%20(RPC)%20pattern%20for%20Next.js%20applications.>) for calling server-side logic directly from your React components. Unlike traditional API calls, Server Actions don't produce a plain HTTP request you can intercept or cancel using an `AbortSignal`. As such, `AbortController` isn't natively supported when working with Server Actions - they're designed to work seamlessly with React's concurrency features rather than supporting low-level request cancellation.

If true request cancellation is required for your use case, such as when working with large or expensive data fetching operations, you'll need to use an API Route Handler (e.g., `app/api/products/route.ts`) or a standard endpoint. These endpoints support `AbortSignal`, allowing you to use `AbortController` to manage request cancellation in a traditional manner.

### Overlapping or Conflicting Transitions

Multiple `useTransition()` calls update the same state concurrently, causing conflicts or unexpected final states.

⚠️ Example:

```jsx
'use client';

import { useState, useTransition } from 'react';

export default function ConflictingTransitions() {
	const [count, setCount] = useState(0);
	const [isPending1, startTransition1] = useTransition();
	const [isPending2, startTransition2] = useTransition();

	const incrementBy2 = () => {
		startTransition1(() => setCount((c) => c + 1));
		startTransition2(() => setCount((c) => c + 1));
	};

	return (
		<div>
			<h1>Count: {count}</h1>
			{(isPending1 || isPending2) && <p>Updating...</p>}
			<button onClick={incrementBy2}>Increment by 2</button>
		</div>
	);
}
```

Both transitions run at the same time. React merges the state updates, but if transitions rely on the same state in different contexts, it can lead to unpredictability (though this exact example might still yield the correct `count`, more complex logic can cause issues).

✅ In order to fix this, bundle related updates into one transition:

```jsx
const incrementBy2 = () => {
	// Use a single transition, bundling all state changes that belong together
	startTransition(() => {
		setCount((c) => c + 1);
		setCount((c) => c + 1);
	});
};
```

### Debugging Complexity

Concurrency scheduling can make debugging more complicated. Log statements, breakpoints, and timeline events may appear out of order. A piece of code might run partially, pause, resume, and then be discarded, making it hard to follow your app's flow.

⚠️ Example:

```jsx
// app/debugging-concurrency/page.tsx

"use client";

import React, { useState, useEffect, useTransition } from "react";

// Simulate a delay for the count update
function simulateDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ConcurrencyRearrangementDemo() {
  const [count, setCount] = useState(0); // Low-priority state
  const [userInput, setUserInput] = useState(""); // High-priority state
  const [isPending, startTransition] = useTransition();

  console.log(`[Render Start] Count: ${count}, UserInput: "${userInput}"`);

  // Effect to log count changes
  useEffect(() => {
    console.log(`[Effect] Count committed: ${count}`);
  }, [count]);

  // Effect to log user input changes
  useEffect(() => {
    console.log(`[Effect] UserInput committed: "${userInput}"`);
  }, [userInput]);

  // Handle increment with a simulated delay
  function handleIncrement() {
    console.log(`[Event Handler] Increment Clicked. Count: ${count}`);

    startTransition(async () => {
      console.log(`[Transition] Starting low-priority count update.`);
      await simulateDelay(2000); // Simulate a 2-second delay
      setCount((prev) => {
        console.log(
          `[State Update] Updating count from ${prev} to ${prev + 1}`
        );
        return prev + 1;
      });
    });

    console.log(`[Event Handler] Transition initiated.`);
  }

  return (
    <div>
      <p>
        <strong>Count:</strong> {count}
      </p>
      <button onClick={handleIncrement} style={{ marginBottom: "1rem" }}>
        Increment (Low Priority)
      </button>
      <br />
      <input
        type="text"
        placeholder="Type here (High Priority)"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        style={{ padding: "0.5rem", width: "300px" }}
      />
      {isPending && <p style={{ color: "gray" }}>Updating count...</p>}
    </div>
  );
}
```

When you click the button and type `React` quickly, logs for high-priority input updates may interleave with or appear before logs from the low-priority count transition.

Console output:

```
[Event Handler]   Increment Clicked. Count: 0
[Transition]      Starting low-priority count update.
[Event Handler]   Transition initiated.
[Render Start]    Count: 0, UserInput: ""
[Render Start]    Count: 0, UserInput: "R"
[Effect]          UserInput committed: "R"
[Render Start]    Count: 0, UserInput: "Re"
[Effect]          UserInput committed: "Re"
[Render Start]    Count: 0, UserInput: "Rea"
[Effect]          UserInput committed: "Rea"
[Render Start]    Count: 0, UserInput: "Reac"
[Effect]          UserInput committed: "Reac"
[Render Start]    Count: 0, UserInput: "React"
[Effect]          UserInput committed: "React"
[State Update]    Updating count from 0 to 1
[Render Start]    Count: 1, UserInput: "React"
[Effect]          Count committed: 1
[Render Start]    Count: 1, UserInput: "React"
```

It's hard to debug, because:

- The logs for userInput (e.g., `"R"`, `"Re"`) appear before the count update logs (`"Updating count from 0 to 1"`), even though the button click happened first.
- It's unclear whether the input state is being updated before, during, or after the transition.
- React may retry or discard renders during transitions. This can result in `useEffect` running for states that aren't final, so we may see `[Effect] Count committed: 1` multiple times in the console, so if you rely on side effects (e.g., API calls or analytics logging), duplicate effects can lead to confusing behavior or incorrect data.
- Logs for intermediate states (e.g., `[Render Start]`) can appear even if React discards them, making it unclear which state React is actually committing.

**How to mitigate debugging challenges**

✅ Add timestamps or unique markers to logs to track when each task starts and finishes:

```jsx
console.log(`[${Date.now()}] Count Update Started`);
```

✅ Use a `useRef` to track the last committed state:

```jsx
const lastCommittedCount = useRef(count);

useEffect(() => {
	console.log(`Committed Count: ${lastCommittedCount.current}`);
	lastCommittedCount.current = count;
}, [count]);
```

✅ Debounce high-priority state updates to reduce frequent interruptions:

```jsx
function handleInputChange(e) {
	debounce(() => setUserInput(e.target.value), 300);
}
```

✅ Use [React DevTools Profiler](https://react.dev/learn/react-developer-tools) - it shows how React pauses, resumes, or retries renders, helping you identify why certain logs appear multiple times or out of order.

### Side-Effects during Interruption

Similarly to previous example, in concurrent mode, React might start rendering a component, then pause, then discard that render entirely if a higher priority update appears - if side-effects run at render-time or are triggered prematurely, they might execute even for a half-complete render.

⚠️ Example:

```jsx
// app/interruption/page.tsx:

"use client";

import React, { useState, useEffect, useTransition } from "react";

// Simulate expensive computation
function generateItems(count: number): string[] {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(`Item ${i + 1}`);
  }
  return items;
}

const INITIAL_COUNT = 5000;
const INCREMENT_BY = 1000;

export default function ConcurrencyInterruptionExamplePage() {
  const [count, setCount] = useState(INITIAL_COUNT);
  const [items, setItems] = useState(() => generateItems(count));
  const [isPending, startTransition] = useTransition();

  // Simulate a "side effect" that logs list size
  useEffect(() => {
    console.log("Side Effect: List size changed to", items.length);
    // In a real app, this could be an analytics call or database update
  }, [items]);

  function handleAddItems() {
    startTransition(() => {
      // Simulate an expensive state update
      setItems(generateItems(count + INCREMENT_BY));
      setCount((prev) => prev + INCREMENT_BY);
    });
  }

  return (
    <div>
      <h1>Concurrency Interruption example</h1>
      <p>
        <strong>Item Count:</strong> {count}
      </p>
      <button onClick={handleAddItems}>Add {INCREMENT_BY} items</button>
      {isPending && <p>Updating items...</p>}
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

Problems in this example:

1. Separate State Updates:
   - count and items are managed as independent state variables, but they are logically tied together.
   - This separation can cause inconsistencies when React handles updates concurrently.

2. Inconsistent State During Concurrency:
   - React's concurrency allows rendering to pause, resume, or even discard updates.
   - Rapid clicks on "Add 5 Items" may result in count and items.length becoming out of sync, especially under heavy user interaction.

3. Uncontrolled Side Effects:
   - The useEffect hook logs the list size (items.length) on every render where items changes.
   - This can lead to duplicate or premature logs for intermediate states that are discarded during partial renders.

> Note: On fast computers or with a lower `INCREMENT_BY` value, these issues might not be noticeable. To reliably reproduce them, throttle your CPU using tools like Chrome DevTools' "Performance" tab.

✅ Here's an example solution:

```jsx
// app/interruption/page.tsx:

"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";

// Simulate expensive computation to generate a list of items
function generateItems(count: number): string[] {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(`Item ${i + 1}`);
  }
  return items;
}

const INITIAL_COUNT = 5000;
const INCREMENT_BY = 1000;

export default function ConcurrencyInterruptionFixedExamplePage() {
  // Unified state: Combine `count` and `items` into a single object
  const [state, setState] = useState(() => ({
    count: INITIAL_COUNT,
    items: generateItems(INITIAL_COUNT),
  }));
  const [isPending, startTransition] = useTransition();

  // Ref to track the last committed count value
  const lastCommittedCount = useRef(state.count);

  // Side effect to log changes in list size (ensures consistency)
  useEffect(() => {
    if (lastCommittedCount.current !== state.count) {
      console.log("Side Effect: List size changed to", state.items.length);
      lastCommittedCount.current = state.count; // Update the committed state
    }
  }, [state]);

  // Handler for adding more items
  function handleAddItems() {
    console.log(`Logging directly: Adding ${INCREMENT_BY} items to the list`);

    startTransition(() => {
      setState((prevState) => {
        const newCount = prevState.count + INCREMENT_BY;
        const newItems = generateItems(newCount);

        return {
          count: newCount,
          items: newItems,
        };
      });
    });
  }

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Concurrency Interruption fixed example</h1>
      <p>
        <strong>Item Count:</strong> {state.count}
      </p>
      <button onClick={handleAddItems} style={{ padding: "0.5rem 1rem" }}>
        Add {INCREMENT_BY} Items
      </button>
      {isPending && <p style={{ color: "gray" }}>Updating items...</p>}
      <ul>
        {state.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

After the changes we have:

1. Unified State
   - `count` and `items` are now managed in a single state object, ensuring that updates to both happen atomically.
   - This eliminates the possibility of `count` and `items.length` diverging during rapid user interactions or concurrent updates.
2. Atomic Updates
   - The `setState` callback (`setState((prevState) => ...)`) ensures that updates are based on the latest committed state, even under React's concurrent rendering.
   - Both count and items are updated together in a single render cycle.
3. `Ref` tracking for Consistent Side Effects
   - The `useRef` (`lastCommittedCount`) tracks the last finalized `count` value.
   - This prevents duplicate or premature execution of side effects for transient states during partial renders.
4. Explicit Side Effects in Event Handlers
   - Logging directly in the `handleAddItems` function ensures critical actions are tied to user interactions, not React's rendering lifecycle.

### Unintended large server workload

With concurrency, Next.js can fetch multiple data sources in parallel for a single server-rendered page. If a page is extremely complex (e.g., a dashboard with many widgets), concurrency might spawn a large number of parallel fetches. Under high traffic, this could spike load on your backend or databases -if the server is not provisioned or your DB rate limits are strict, you can overwhelm your own infrastructure quickly.

The easiest ways to mitigate this issue are:

- Using server components caching (e.g., `revalidate` or custom caching) to avoid repeated queries for the same data.
- Combining multiple queries into a single `fetch` if they come from the same source (e.g., an aggregated `GraphQL` query).
- Monitoring logs and server metrics for concurrency spikes, and consider rate limiting or using a queue if necessary.

### Memory Overuse in Server Components

When concurrency is high (numerous requests), and you're storing large in-memory data structures within your server components or global singletons, memory usage can balloon. This is somewhat analogous to the [caching pitfalls](/frontend/react/recipes/caching-and-revalidation#changing-cache-key-on-every-request), but specific to concurrency: each concurrent render might temporarily hold references to large data sets before they're streamed out.

This happens because server components can hold onto data until the entire render for a request is completed or until _Suspense_ boundaries have resolved.
If you have large objects or unbounded lists in memory for each parallel request, your _Node.js_ process can run out of memory.

Mitigation:

- Stream data incrementally if possible, so you're not storing the entire result in memory at once.
- Use external caches or databases for storing large datasets rather than keeping them in memory.
- Keep an eye on memory usage with tools like docker stats or external monitoring, and scale your server if concurrency demands increase.

### Frequent Resetting of Partial UI

If you have many Suspense boundaries or transitions triggered in quick succession (e.g., user is clicking rapidly through different filters), the UI might keep returning to fallback loading states or re-initializing parts of the page. This can feel jarring for the user.

⚠️ Example:

```jsx
<div>
	<h1>Complex Dashboard</h1>
	<Suspense fallback={<LoadingSpinner />}>
		<WidgetA />
	</Suspense>
	<Suspense fallback={<LoadingSpinner />}>
		<WidgetB />
	</Suspense>
	<Suspense fallback={<LoadingSpinner />}>
		<WidgetC />
	</Suspense>
</div>
```

✅ Mitigation:

- Avoid placing `<Suspense>` boundaries that are too granular. Group related sections so they load or stay loaded together.
- For repetitive transitions (like a user toggling filters quickly), consider debouncing or limiting how often you trigger a _Suspense-based_ data fetch.
- Use client-side state or local caching to preserve partial results, so toggling a filter doesn't always cause a full teardown.

```jsx
<Suspense fallback={<LoadingSpinner />}>
	<section>
		<WidgetA />
		<WidgetB />
		<WidgetC />
	</section>
</Suspense>
```

### Overreliance on Concurrency for “Real-Time” feeds

Concurrency makes UI updates smoother, but it does not inherently solve real-time data needs. Developers might assume that “_Concurrent Rendering_” + “_Streaming_” automatically means the app is real-time, leading to confusion when data is still delayed or stale.

Concurrency optimizes the rendering pipeline but doesn't provide a push-based model by itself. You still need websockets or polling for truly real-time data. Also, the streaming SSR is a one-time flow per request. After hydration, it's the client's responsibility to update data.

Things to keep in mind:

- If near-instant updates are required, consider fully client-driven strategies or server actions triggered by push notifications.
- Don't rely on concurrency to magically keep data up-to-date; it only helps with how React processes updates once they arrive.

## Motivation

Most of the applications we build have some kind of a login and protected pages. To make this possible, we use sessions. Using DatX, let's create a session model class.

## Session model

```ts
import { Model, prop } from 'datx';

export class SessionModel extends Model {
	public static type = 'session';
}
```

Session model is not really helpful on it's own and because of that it usually has a relationship to the user model. Now our session model looks like this

```ts
import { Model, prop } from 'datx';
import { UserModel } from 'models/UserModel';

export class SessionModel extends Model {
	public static type = 'session';

	@prop.toOne(UserModel)
	public user: UserModel;
}
```

## Network

Now, when we have defined session model we can create basic fetchers for the session. We'll create three fetchers - `createSession`, `readSession` and `deleteSession`. We'll create those fetchers using DatX.

_Following fetchers assume that application is using cookies for authentication. To use token or something else, the following methods can easily be extended._

```ts
import { SessionModel } from 'models/SessionModel';

/**
  Creates and returns a session from an endpoint.
  User model is included in the response.
*/
export async function createSession(datx, loginData) {
	const res = await fetch(SESSION_API_ENDPOINT, {
		method: 'POST',
		body: loginData,
		// ...rest of the options
	});
	const rawSession = await res.json();
	const session = datx.add(data, SessionModel);

	return session;
}

/**
  Based on a cookie, request returns a current session if any.
  User model is included in the response.
*/
export async function readSession(datx) {
	const res = await fetch(SESSION_API_ENDPOINT, {
		method: 'GET',
		// ...rest of the options
	});
	const rawSession = await res.json();
	const session = datx.add(data, SessionModel);

	return session;
}

/**
  Deletes a session and clears the cookie.
*/
export async function deleteSession(datx) {
	await fetch(SESSION_API_ENDPOINT, {
		method: 'DELETE',
		// ...rest of the options
	});

	// since only one session can be active per browser, following is OK to do
	datx.removeAll(SessionModel);

	return null;
}
```

## `useSession` hook

To make a session model accessible in the React components, we'll create a `useSession` hook that will expose a session. We have many ways to implement this, but for the sake of this example we'll stick to [SWR](https://swr.vercel.app/). _SWR is a React Hooks library for data fetching._

```tsx
import { useCallback } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { useDatx } from 'hooks/useDatx';
import { createSession, deleteSession, readSession } from 'fetchers/session';

interface IUseSessionOptions extends SWRConfiguration {
	onLoginError?(error): void;
	onLoginSuccess?(session): void;

	onLogoutError?(error): void;
	onLogoutSuccess?(): void;
}

export function useSession({
	onLoginError,
	onLoginSuccess,
	onLogoutError,
	onLogoutSuccess,
	...config
}: IUseSessionOptions = {}) {
	const datx = useDatx();

	const state = useSWR('session', () => readSession(), {
		shouldRetryOnError: false,
		errorRetryCount: 0,
		...config,
	});

	const callbackRefs = useRef({ onLoginSuccess, onLoginError, onLogoutSuccess, onLogoutError });

	useEffect(() => {
		callbackRefs.current = { onLoginSuccess, onLoginError, onLogoutSuccess, onLogoutError };
	});

	const login = useCallback(
		async (attributes) => {
			const session = createSession(datx, attributes).then(
				(session) => {
					callbackRefs.current.onLoginSuccess?.(session);

					return session;
				},
				(error) => {
					callbackRefs.current.onLoginError?.(error);

					return Promise.reject(error);
				}
			);

			return state.mutate(session, false);
		},
		[datx, state]
	);

	const logout = useCallback(async () => {
		const session = deleteSession(datx).then(
			() => callbackRefs.current.onLogoutSuccess?.(),
			(error) => {
				callbackRefs.current.onLogoutError?.(error);

				return Promise.reject(error);
			}
		);

		return state.mutate(session, false);
	}, [datx, state]);

	return { login, logout, state };
}
```

Since there is a lot of code, let's explain it section by section.

`useDatx` hook is used to provide DatX collection to our session fetchers. How to set up DatX in an application, you can follow [DatX Store Provider](./datx-store-provider) chapter from this handbook.

```ts
const state = useSWR('session', () => readSession(), {
	shouldRetryOnError: false,
	errorRetryCount: 0,
	...config,
});
```

This part will create a swr state by using `readSession` method. It won't retry on error because if we get an error that should mean that we are not logged in.

Next thing we have are two callbacks - `login` and `logout`. Those two are returned by the hook and can be used in the, i.e., login form to make a login request to the backend API. They both have success and error callbacks that will be called if they are defined. Those two callback will also mutate the swr state.

Now, once we have defined and explained the `useSession` hook, it can be used in any React component that can access to `DatxProvider`.

```tsx
const SomeComponent = () => {
	const { state } = useSession();

	const session = state.data;

	return <p>{session ? 'Session exists' : 'Session does not exists'}</p>;
};
```

## `AuthRedirect`

As mentioned in the introduction of this section, often there is a need for private (protected) pages. To achieve this we can create following logic:

```tsx
const Content = () => {
  const { state } = useSession();

  const session = state.data;

  return {session ? <PrivateContent /> : <Loading />}
}

const SomePrivatePage = () => {
  const { state } = useSession();
  const router = useRouter();

  const session = state.data;
  const sessionError = state.error;

  useEffect(() => {
    if (!session && sessionError) {
      router.push('/');
    }
  }, [session, sessionError, router]);

  return (
    <Layout>
      <Header />

      <Content />

      <Footer />
    </Layout>
  );
};
```

Although this might look like a simple page redirect, it's not really optimized - rerender will occur and might hurt performance.

Once the page is loaded and the component is mounted, `session` and `sessionError` will be `undefined` since the request did not happen yet. Once request to read a session is triggered, `session` or `sessionError` will be defined, and re-render will occur, and this, potentially, might be an expensive operation. To optimize this, we'll create a component that will handle the redirect based on authentication.

```tsx
interface IAuthRedirectProps {
	/**
	 * URL used to redirect a user to
	 * By default, if only this prop is set, the component will redirect if no session is found
	 */
	to: Url | string;
	/**
	 * If this property is set to `true`, user will be redirected if he is logged in.
	 * Useful when you don't want to show login page to already logged in users.
	 *
	 * Will be ignored if `condition` is defined.
	 */
	ifFound?: boolean;
	/**
	 * Callback that will trigger a redirect if true is returned.
	 * Useful when you need to redirect base on some attribute, e.g. if user is not admin
	 */
	condition?(session: SessionModel): boolean;
}

const AuthRedirect: FC<IAuthRedirectProps> = ({ to, ifFound, condition }) => {
	const {
		state: { data, isValidating, error },
	} = useSession();
	const { push } = useRouter();

	useEffect(
		() => {
			// if state is validating, wait until request is done
			if (isValidating) {
				return;
			}

			// https://swr.vercel.app/advanced/performance#dependency-collection
			const hydration = data === undefined && error === undefined && isValidating === false;
			if (hydration) {
				return;
			}

			// `condition` has a priority over a `ifFound` property
			if (condition) {
				if (condition(data)) {
					push(to);
				}

				return;
			}

			const shouldRedirect = (ifFound && data) || (!ifFound && !data);

			if (shouldRedirect) {
				push(to);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[data, isValidating, error, to, ifFound]
	);

	// this component renders nothing since it is only used to redirect if needed.
	return null;
};
```

> **Note** we added `eslint-disable-next-line react-hooks/exhaustive-deps` to the `useEffect` hook. This is because we don't want to rerender the component if `condition` and `push` are changed. We are aware this is a dangerous thing to do, but in this case, it is a necessary evil. This issue will be resolved when React finishes `useEffectEvent` hook. More about this can be found [here](https://react.dev/learn/separating-events-from-effects#reading-latest-props-and-state-with-effect-events)

If we now implement this in our example, it looks like this.

```tsx
const SomePrivatePage = () => {
	return (
		<Layout>
			<Header />

			<AuthRedirect to="/" />
			<Content />

			<Footer />
		</Layout>
	);
};
```

Now, the `useSession` is not called on a page level and therefore won't cause a rerender of a entire page. As a result, this will decrease time needed for a rerender.

### Props

In `AuthRedirect` props we have defined multiple properties:

#### `to`

`to` property is used as an argument when calling `router.push`. If redirect needs to occur, this is where user will be redirected.

#### `ifFound`

`ifFound` property is an optional property. It can be used to change the logic when the redirect needs to occur. If set to `true, a redirect will occur if the session exists - this is useful to hide the login/registration page when the session exists.

```tsx
// redirect if session exits
<AuthRedirect to="/" ifFound />
```

_NOTE: if `condition` prop is defined, `isFound` prop will be ignored._

#### `condition`

`condition` property is an optional property. This property is a function that takes the session as an argument and returns a boolean. It will determine if a redirect should occur or not. This can be useful if you need to create a redirect on some condition based on a session.

```tsx
// redirect if logged in user is not an admin
<AuthRedirect to="/" condition={(session) => session?.user.role !== 'admin'} />
```

## Motivation

An ideal goal is to support all the platforms and all the browsers when developing a web application,
but sometimes this is difficult or not profitable, especially today when a lot of devices can have
their own ways of connecting to the Internet (including TVs and refrigerators).

Because of that you need some easy mechanism to just tell: "We are so sorry, but please install more
sophisticated browser" - without your application crashing before it can even show the message.

Luckily, from Next.js version [10.1.0](https://github.com/vercel/next.js/releases/tag/v10.1.0)
(`Add has route field`), you can use some specific property for redirects in `next.config.js` that
can help you with that.

## The issue

Your application may cover a lot of different browsers, but still there are many commonly used browsers
which probably can not run your application - either it does not look good or crashes.

There might be issues with your own implementation or some 3rd party library, and you can not replace
any of it easily or without sacrificing something else (time, cost, functionality, etc.).

This problem is easier to fix if the application is not crashing before showing at least a popup,
but it gets impossible if you have errors before JS is even executed.
This is where Next.js redirects and `has` property shines.

## The fix

There is more to talk about redirects, which can also be read in
[Next.js redirects by header, cookie and query matching](https://nextjs.org/docs/api-reference/next.config.js/redirects#header-cookie-and-query-matching),
but the most important is the `has` property which allows you to configure in what circumstances should your application be redirected when hitting some path.

So without further ado, here is the Next.js config which redirects requests from any
unsupported browser (user-agent header matches regex, in our case for Internet Explorer)
to the `not-supported.html` file located in the `public` folder.

```js
// next.config.js

module.exports = {
	// ...
	async redirects() {
		return [
			{
				source: '/', // all paths should be checked and redirected
				has: [
					{
						type: 'header', // we want user-agent and user-agent is part of the header
						key: 'user-agent',
						value: '.*(MSIE|Trident).*', // regex which checks if either MSIE or Trident is somewhere in user-agent string - we are excluding IE browser
					},
				],
				permanent: true, // we want redirect to be permanent
				destination: '/not-supported.html', // this file is from public folder; it can be some other file on some other server
			},
		];
	},
};
```

Once again, above code says: redirect all paths to `public/not-supported.html` if you come across
words "MSIE" or "Trident" in user-agent header and make this permanent redirecton.

This way your app will not crash, or displayed because not a single JS from your application will be served prior
to the redirection check.

`has` property can be used for more things than redirection based on the browser agent.

## The implications

The only problem that can occur is if you have wrong regex for browser detection so test your
implementation.
Also double check if you want to exclude some browser since you are narrowing your audience (users).# Tailwind CSS - Best Practices, FAQ, and Recipes

This chapter gathers the tips, conventions, and tooling setup that keep our Tailwind codebase predictable and approachable for everyone from interns to principal engineers.

## FAQ

### Can I concatenate strings to build class names?

No. As soon as you write something like `'bg-' + color + '-500'`  
Tailwind's compiler cannot see the literal class names during the template scan, so it purges every potential match. Your colour vanishes in production and you spend an afternoon chasing why the button is transparent, this is very similar case to [Panda CSS Dynamic Styling](https://panda-css.com/docs/guides/dynamic-styling). Always pass complete strings to the compiler. When classes are conditional, wrap them with the `cn` helper or a CVA variant so the literals remain visible.

### Can Tailwind coexist with libraries like Material UI?

Yes. Tailwind is just CSS classes; it does not add a runtime. Two integration patterns work well:

- Simply use the utility classes in MUI components
  ```tsx
  <Button className="bg-brand-600 shadow-md" />
  ```
- Use Tailwind for layout, MUI for logic - Tailwind controls flex grids, spacing, and colors, while the MUI theme handles stateful styles (disabled, focus)

Important: make sure `tailwind.css` is imported after any baseline or component library stylesheet so its utilities win specificity ties.

### How do I handle dark mode?

Use Tailwind's `dark:` variant together with CSS custom properties:

```css
@theme {
	--color-sidebar-border: var(--color-slate-200);
	--color-sidebar-background: var(--color-slate-100);
}

@layer theme {
	.dark {
		--color-sidebar-border: var(--color-slate-800);
		--color-sidebar-background: var(--color-slate-900);
	}
}
```

You can also do it like this:

```css
:root {
	--acme-canvas-color: oklch(0.967 0.003 264.542);
}

[data-theme='dark'] {
	--acme-canvas-color: oklch(0.21 0.034 264.665);
}
```

Then in JSX:

```tsx
className = 'bg-brand-500 dark:bg-brand-500/80';
```

Switching the dark class on `<html>` node flips every token instantly without component re-renders.

Check the [Colors documentation](https://tailwindcss.com/docs/colors) to learn more.

### How do I handle responsive design with Tailwind?

Tailwind CSS follows a mobile-first approach using breakpoint prefixes. You write base styles without a prefix and override them using responsive modifiers:

```tsx
<div class="p-2 md:p-4 lg:p-6">
  <!-- Small screens: 0.5rem, Medium: 1rem, Large: 1.5rem padding -->
</div>
```

You can also add hover:, focus:, and more within breakpoints:

```tsx
<button class="text-sm md:hover:text-lg">Click me</button>
```

For a deeper dive, check out Tailwind's [Responsive Design guide](https://tailwindcss.com/docs/responsive-design) - it covers customizing breakpoints, stacking multiple modifiers (like md:hover:), and other advanced patterns for building complex, fluid layouts.

### What is the `@utility` directive and when should I reach for it?

`@utility` lets you bundle several raw CSS declarations under a single Tailwind-style class without leaving your stylesheet. It is perfect for verbose properties such as `clip-path` or complex shadows that would otherwise require an arbitrary value every time.

```css
@utility {
	.clip-blob {
		clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
	}
}
```

You can now reuse `clip-blob` alongside built-in utilities with complete purge safety and no JavaScript.

### How does the group utility help with state-based styling?

Instead of repeating the same prefix on multiple siblings (`hover:`, `focus:`), wrap them in a parent that carries `group`:

```tsx
<button className="group bg-brand-600 inline-flex items-center gap-2 rounded-lg p-3">
	<Icon className="size-4 text-white transition-transform group-hover:translate-x-0.5" />
	<span className="text-white group-hover:underline">Download</span>
</button>
```

Any child can now react to `group-hover`, `group-focus`, `group-aria-expanded`, etc., keeping class strings short and readable.

### My hover and focus class lists are gigantic. Is there a cleaner pattern?

Use CVA or the `cn` helper to build a map of state variants instead of stacking prefixes manually:

```tsx
const card = cva('rounded-lg p-4 transition', {
	variants: {
		intent: {
			default: '',
			hover: 'hover:bg-brand-50 hover:shadow',
			focus: 'focus-visible:ring-brand-600 focus-visible:ring-2',
		},
	},
});
```

Apply the variant you need with `card({ intent: 'hover' })`. Literal strings remain visible for the compiler and you avoid prefix noise.

### How do I configure Material UI so Tailwind utilities take effect?

In MUI v5 you must enable CSS custom properties:

```tsx
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
	cssVarPrefix: 'mui', // any prefix is fine
	cssVarEnabled: true, // critical: ensures Tailwind variables cascade
});
```

With `cssVarEnabled` set to true, Tailwind classes applied via `className` or `sx` override MUIs default palette and spacing. Remember to load `tailwind.css` after the MUI baseline styles so utility specificity wins.

### When is it acceptable to sprinkle !important?

Only when a third-party library injects an inline style or a high-specificity rule that you cannot control. Scope the override to the smallest selector possible, document the reason, and keep a TODO to remove it once the upstream lib allows custom classes.

```tsx
<!-- Third-party widget injects an inline red background we can’t control -->
<div className="p-4 text-white !bg-blue-500">
  The “!” prefix turns bg-blue-500 into bg-blue-500 !important,
  overriding the inline style without raising overall specificity.
</div>

<!-- You can combine it with other modifiers too -->
<div className="bg-gray-100 md:!bg-blue-500">
  On small screens: gray background
  On ≥ md screens: blue background !important
</div>
```

### I keep typing align-center instead of items-center. How do I memorise Tailwind's naming?

Tailwind mirrors **justify-** for main-axis alignment and **items-** for cross-axis. A quick mnemonic: “Flex items cross the axis”. Also make sure to turn on IntelliSense - misspelled utilities show a red underline and the correct suggestion in the hover tooltip.

If you really can't remember ANY Tailwind naming, just keep the [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet) opened, or get yourself the [Raycast Addon](https://www.raycast.com/vimtor/tailwindcss).

### Why is Tailwind IntelliSense considered mandatory?

- Autocompletes tokens and arbitrary values
- Flags mistyped utilities immediately
- Previews final CSS for any class
- Understands our `cn` and `cva` patterns through the custom regex in `.vscode/settings.json`

The plugin removes 90 percent of tab-out-and-Google moments, making new hires productive within hours, not days.

### Initial Tailwind setup feels slow. How can I streamline it?

Use the project starter that already includes:

- Tailwind v4 configured with `@theme` tokens
- Prettier and ESLint plugins pre-wired
- `cn` helper, CVA wrapper, and example primitives
- VS Code workspace settings for IntelliSense

Starting from template means you write your first utility within five minutes, bypassing the boilerplate phase entirely.

## Code Recipes

### The `cn` Helper

Create `lib/cn.ts` once per repo:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

Always call `cn` instead of template-string concatenation:

```tsx
<div className={cn('grid grid-cols-1 gap-4', isSidebarOpen && 'lg:grid-cols-[240px_1fr]')} />
```

### Conditional Variants Without String Math

Bad pattern:

```tsx
className={`bg-${status}-50 text-${status}-700`}
```

Good pattern with CVA:

```tsx
const badge = cva(
    'inline-flex items-center rounded px-2 py-0.5 text-sm font-medium',
    {
    variants: {
        intent: {
        info:  'bg-sky-50  text-sky-700',
        warn:  'bg-yellow-50 text-yellow-700',
        error: 'bg-red-50 text-red-700'
        }
    }
    }
)

<span className={badge({ intent: status })}>{label}</span>
```

This preserves purge safety, keeps colors centralised, and eliminates template string bugs.

### Safelisting Dynamic Utilities

If you need to make sure Tailwind generates certain class names that don't exist in your content files, use [@source inline()](https://tailwindcss.com/docs/detecting-classes-in-source-files#safelisting-specific-utilities) to force them to be generated:

```css
@source inline('{bg-,text-,border-}{brand,info,warn,error}-{50,100,500,700}');
```

## Editor and Linting Setup

### Tailwind IntelliSense

1. Install VS Code extension `bradlc.vscode-tailwindcss`
2. Enable `.vscode/settings.json` so autocomplete works inside our `cn` helper

   ```json
   {
   	/**
   	 * Tailwind CSS IntelliSense extensions settings
   	 * https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss
   	 */
   	"files.associations": {
   		"*.css": "tailwindcss" // Tells VS Code to always open *.css files in Tailwind CSS mode - this prevents you from using Stylelint in the project, but gives you autocomplete in @apply directives
   	},
   	"editor.quickSuggestions": {
   		"strings": "on" // Enable quick suggestions inside strings
   	},
   	// Enables Tailwind CSS IntelliSense extension in "cva" and "cn" functions,
   	// sorting is configured in Prettier settings
   	"tailwindCSS.experimental.classRegex": [
   		["cva\\(((?:[^()]|\\([^()]*\\))*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
   		["cn\\(((?:[^()]|\\([^()]*\\))*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
   	]
   }
   ```

### ESLint Plugin for Tailwind

> ⚠️ Warning! As of June 2025, the Tailwind ESLint plugin is not compatible with Tailwind CSS v4. Follow [this issue](https://github.com/francoismassart/eslint-plugin-tailwindcss/issues/325) for more information.
>
> 📌 Note: The following example is for Tailwind CSS v3.

Add `eslint-plugin-tailwindcss`:

```bash
pnpm add -D -E eslint-plugin-tailwindcss
```

ESLint config snippet:

```js
plugins: ['tailwindcss']
extends: ['plugin:tailwindcss/recommended']
rules: {
'tailwindcss/classnames-order': 'error',
'tailwindcss/enforces-shorthand': 'warn'
}
```

This catches missing classes, wrong order, and unknown utilities.

### Prettier Plugin for Tailwind Sort

Prettier will group and sort class strings. Install `prettier-plugin-tailwindcss`:

```bash
pnpm add -D -E prettier prettier-plugin-tailwindcss
```

Prettier config file:

```js
plugins: ['prettier-plugin-tailwindcss'], // Enables Tailwind classes sorting
tailwindFunctions: ['cva', 'cn'], // Enables sorting of Tailwind classes in "cva" and "cn" functions, IntelliSense is configured in ".vscode/settings.json"
```

## Common Pitfalls and How to Dodge Them

- **Arbitrary values explosion** - every unique `shadow-[...]` makes a rule. Centralise rare values with `@apply` inside a utility class
- **Missing plugin utilities** - classes like `animate-in` need `tailwindcss-animate`

# Introduction to Tailwind CSS

Tailwind CSS is a **utility-first styling framework**. Instead of shipping pre-styled components or encouraging semantic class names, Tailwind exposes thousands of small, composable classes, each mapping one-to-one with a single CSS declaration:

- `pt-4` → `padding-top: 1rem`
- `flex` → `display: flex`
- `bg-blue-600/90` → `background-color: rgba(37, 99, 235, 0.9)`

You place these classes directly in your JSX. When the build runs Tailwind's compiler, now called **Oxide** (rewritten in Rust for v4), scans every template, generates only the CSS you referenced, minifies it, and removes everything else. The output is a single static stylesheet with zero runtime JavaScript.

## A Three-Second Mental Model

1. **Everything is opt-in**  
   If you never write `rounded`, nothing gets rounded. No default design decisions are imposed.

2. **Markup is the source of truth**  
   Delete a component in React and its styles vanish automatically. There is no orphan stylesheet to clean up.

3. **Classes read like English**  
   `flex flex-col gap-6 lg:flex-row items-center bg-surface p-8` tells you the `layout, spacing, breakpoint variation, alignment, colour and padding` in one glance.

4. **Design tokens are code**  
   Colours, spacing steps, radii and shadows live in `tailwind.config.js` (or in v4 inside an `@theme` block). Every token becomes a real CSS custom property, readable by JavaScript, Framer Motion or even a Figma plugin that scrapes the DOM.

## How Tailwind Works Under the Hood

### The JIT Compilation Cycle

1. **Template scan** - Oxide reads your `.tsx`, `.mdx`, `.html` and any other file types you list. It tokenises class attributes, including the more exotic arbitrary value syntax like `max-w-[42ch]`.
2. **Class lookup** - Each token maps to a rule in Tailwind's internal AST. Tailwind also supports user-defined classes added through the `theme.extend` or `@apply` directives.
3. **CSS emission** - Only referenced rules are emitted. Tailwind groups selectors that share the same declaration to keep file size minimal.
4. **Minification and purging** - Duplicate declarations are collapsed, comments are stripped and the file is saved alongside the rest of your assets. Because unused CSS is never written in the first place, the purge step is effectively free.
5. **Incremental rebuilds** - Oxide tracks a dependency graph. Editing a single component triggers micro-rebuilds that typically complete in under 50 ms even for large mono-repos.

### Configuration in v4

```css
@import 'tailwindcss';

@theme {
	--radius-lg: 0.75rem;
	--brand-500: 34 197 94; /* R G B */
}
```

No separate JavaScript config file is required, and those custom properties are accessible at runtime:

```ts
const brand = getComputedStyle(document.documentElement).getPropertyValue('--brand-500');
```

## Comparing Tailwind to other styling solutions

Below comparison is focused on developer experience, performance and how well each option fits Next.js, React Server Components (RSC) and streaming.

### Global CSS and SCSS

- **What it is** - One or a handful of style sheets imported at `_app.tsx` or the root layout.
- **Impact** - Fast builds, no runtime overhead, but the global cascade introduces accidental regressions.
- **Why Tailwind wins** - Utilities are local and predictable, eliminating the “who overrode my h1?” problem.

### CSS/SCSS Modules

- **What it is** - Next.js transpiles `.module.css` or `.module.scss` files into unique class names.
- **Impact** - Small bundle, no runtime penalty, but lots of files and boilerplate selectors.
- **Why Tailwind wins** - You rarely leave the JSX file and unused CSS is stripped automatically.

### Styled JSX (Next.js default)

- **What it is** - Inline styles scoped to a component, compiled to CSS at build time, injected with `<style>` tags.
- **Impact** - Good isolation, but every component ships extra JS to inject its styles.
- **Why Tailwind wins** - No runtime injection means faster hydration and less JavaScript over the wire.

### Emotion / Styled-Components

- **What it is** - Tagged template literals that generate styles at runtime (or via Babel for partial extraction).
- **Impact** - Powerful conditional styling but increases bundle size and complicates the RSC boundary.
- **Why Tailwind wins** - Styles are static assets processed at build, so nothing crosses the server-client line.

### Stitches, Panda, Vanilla-Extract

- **What they are** - Compile-time CSS-in-JS libraries that aim for zero runtime.
- **Impact** - Predictable output, but you learn a custom API and maintain separate style files.
- **Why Tailwind wins** - Utilities use the universal language of class names; JSX shows the final UI instantly.

### UI Component Libraries (Chakra UI, Material UI)

- **What they are** - High-level accessible React components with theming and style props.
- **Impact** - Great productivity for simple apps, but extra JavaScript and difficult deep customisation.
- **Why Tailwind wins** - Tailwind plus **shadcn/ui** gives copy-paste recipes with zero runtime cost.

## Pros and Cons of Tailwind CSS

### Strengths

- **Small static CSS** - Multi-tenant SaaS apps often ship under 30 KB gzipped.
- **Fast refactors** - Styles live and die with their JSX.
- **Token driven** - Edit a brand color in one file and every component updates.
- **Performance** - No style tag insertion or flash-of-unstyled-content.
- **Ecosystem** - Plugins for forms, typography, aspect-ratio and many Tailwind-native component kits.

### Trade-offs

- **Class verbosity** - Long class strings need Prettier and ESLint rules.
- **Learning curve** - Utility syntax feels alien for a week or two.
- **Arbitrary values** - `ml-[17px]` undermines consistency if unpoliced.
- **No baked components** - You must build or adopt primitives like **shadcn/ui**.
- **Potential reset conflicts** - Tailwind should load after any CSS reset.

## Why We Replaced Chakra UI with Tailwind

| Concern         | Chakra UI                               | Tailwind CSS                      |
| --------------- | --------------------------------------- | --------------------------------- |
| Bundle size     | 40-80 KB CSS, 25-60 KB JS               | < 30 KB CSS, negligible JS        |
| Runtime cost    | Emotion creates class names at runtime  | None                              |
| Theming         | Tied to Chakra's token names and scales | Plain CSS variables, any naming   |
| Custom variants | `extendTheme` JS code                   | Combine utilities or use `@apply` |
| Server comps    | Experimental hydration path             | Works out of the box              |
| Refactors       | Prop explosion (`_hover={{ bg: ... }}`) | Pure HTML classes, quick edits    |

### Migration Journey - Recommended Workflow

1. **Token mapping** - export the current Chakra (or any other) theme to JSON (use `npx @chakra-ui/cli tokens`). Copy colours, spacing, radii and font scales into Tailwind's `@theme` block. Preserve token names one-for-one so existing design language stays intact.
2. **Parallel Tailwind setup** - [Install Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
3. **Component wrappers** - introduce thin legacy shims such as `<LegacyButton>` or `<LegacyBox>`. Each shim keeps the Chakra prop API but renders plain HTML with Tailwind utilities. This lets you migrate page-by-page without a disruptive big-bang refactor.
4. **Incremental replacement** - prioritize the highest-traffic or most visually shared primitives first (Button, Input, Modal). For each component:

   - replace Chakra props with Tailwind class strings
   - snapshot the result in Storybook or Playwright
   - verify accessibility states, focus rings and responsive behaviour

5. **Design-system parity check** - run a UI/UX audit once every Chakra component has a Tailwind counterpart. Compare variant, state and breakpoint coverage; update tokens or utilities until every design spec passes.

6. **Dependency removal** - remove `<ChakraProvider>` and `CSSReset`, delete Chakra from `package.json`, and run grep to locate any lingering `_hover` or `variant` props.

7. **Ship and measure** - deploy to staging and measure bundle size and Core Web Vitals against the previous build. Teams consistently see
   - **JS bundle shrink** ≈ 15-25 %
   - **First Contentful Paint** improve by 200-300 ms on a 3G Fast profile
   - **Developer velocity** increase thanks to clearer, inline class semantics

## Common Concerns and How We Answer Them

| **Question**                         | **Answer**                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Isn't Tailwind hard to read?         | After a short ramp-up, seeing colour, spacing and typography inline is faster than jumping to a CSS file    |
| Will utility classes bloat the HTML? | Gzip/Brotli compress repeating prefixes well; file size impact is minimal                                   |
| Can designers work with Tailwind?    | Tokens live in one config file and are exported to Figma via the Tailwind Tokens plugin                     |
| What about dark mode or theming?     | Tailwind's `dark:` variant and CSS variables enable instant theme switching without re-rendering components |

## Further Reading

- Documentation
  - [Tailwind CSS documentation](https://tailwindcss.com/docs)
- Articles
  - [It is Possible to Mix Chakra UI with Tailwind CSS ?](https://www.geeksforgeeks.org/it-is-possible-to-mix-chakra-ui-with-tailwind-css/)

# ShadCN UI

ShadCN UI (often written simply as **shadcn/ui**) is a set of open-source React component templates that sit on top of [**Radix UI** primitives](https://www.radix-ui.com/primitives) and **Tailwind CSS** utilities. It is not a full-blown design system like Material UI or an abstract component library like Chakra. Instead it gives you copy-and-paste blueprints for accessible UI parts that remain **100 percent yours** after generation. Think of it as a scaffold: it bootstraps predictable, well-tested markup and behaviour, then gets out of your way so you can style or refactor without fighting an API surface.

## What Is ShadCN UI?

ShadCN UI is a project maintained by [@shadcn](https://x.com/shadcn) that curates Radix primitives into higher-level patterns - buttons, dialogs, dropdowns, tables, tabs, and more. Each component is provided as plain `.tsx` code plus matching Tailwind classes. There is **no package to import at runtime**. You run a CLI script once, commit the generated files to your repo, and thereafter treat them like any other local component. Updates are opt-in: rerun the script with the `add` command, accept the diff in a pull request, customise as you wish.

Key attributes:

- **Headless but helpful** - logic, state and accessibility baked in; visual style left to Tailwind
- **Ownership** - generated files live in your `components` folder; rename, inline, split - nothing breaks
- **Type-safe** - everything is written in TypeScript and ships Radix-level type definitions
- **Composable** - each primitive is compatible with [tailwind-variants](https://www.npmjs.com/package/tailwind-variants) or [class-variance-authority (CVA)](https://cva.style/docs) for themeable variants

## Why We Chose ShadCN UI

- **Tailwind alignment** - every snippet already uses Tailwind utilities, so our design tokens and responsive classes work out of the box
- **No runtime payload** - because components are local code, we avoid shipping extra JavaScript bundles or CSS files
- **Accessible by default** - Radix UI handles focus traps, keyboard navigation and ARIA attributes. QA can focus on business logic, not low-level a11y
- **Incremental adoption** - we can generate only the primitives we need, drop them into an existing codebase, and migrate gradually
- **Long-term maintainability** - owning the files means we are not blocked by upstream releases. If a bug appears we can patch it immediately

## Core Principles and Design Philosophy

1. **Copy, do not import** - you generate source once and version-control it. No vendor lock-in
2. **Radix first** - behaviour comes from Radix primitives ([Dialog](https://www.radix-ui.com/primitives/docs/components/dialog), [Popover](https://www.radix-ui.com/primitives/docs/components/popover), [ScrollArea](https://www.radix-ui.com/primitives/docs/components/scroll-area)) which have battle-tested accessibility
3. **Tailwind for visuals** - styling stays declarative and token-driven. There is no CSS-in-JS runtime or Shadow DOM
4. **Plain React** - no custom renderers, no wrappers around hooks; what you see is what you get
5. **Opt-in complexity** - advanced features (CVA variants, Framer Motion animations) are present but optional

## Installing ShadCN UI in a Next.js + Tailwind Stack

The project ships a small CLI you run once during setup. In a fresh repository:

1. Ensure Tailwind is already configured (our project starter includes it)
1. Initialise shadcn/ui:  
   `npx shadcn-ui@latest init`
   - The script prompts for your project path (`src`), components path (`components/ui`), styling solution (`Tailwind CSS`), and preferred alias
1. Generate your first component, for example Button:  
   `npx shadcn-ui@latest add button`

The script drops `button.tsx` into `components/ui`. It also updates `tailwind.css` with any missing plugin or theme extension. Commit the diff - you own these files.

## Project Structure and File Conventions

Our should follow similar layout:

```
app/
    components/
        ui/
            button.tsx
            dialog.tsx
    lib/
        tailwind/
            tailwind.css
```

- **components/ui** - atomic primitives straight from `shadcn/ui`. Keep each file self-contained
- **components/** (root) - higher-level composites that import primitives
- **lib/** - helper utilities, CVA variant factories, Framer Motion wrappers
- **lib/tailwind/tailwind.css** - houses Tailwind's `@import 'tailwindcss';` plus any custom layers

Generated files follow these conventions:

- **PascalCase filenames** (`alert-dialog.tsx`)
- **CVA** variant definitions placed near the top for quick customisation

## Working with Primitives

### Buttons

The generated Button uses CVA to expose `variant` (`default | destructive | ghost | link`) and `size` (`sm | lg`) props. Extend with new variants by editing the `cva()` call and updating the union type.

Example usage:

```tsx
<Button variant="destructive" size="lg" asChild>
	<Link href="/danger-zone">Delete account</Link>
</Button>
```

`asChild` comes from Radix Slot and lets any element inherit Button behaviour.

### Inputs and Forms

shadcn/ui provides `input.tsx`, `label.tsx` and `textarea.tsx` primitives. Combine them with `react-hook-form`:

```tsx
const { register } = useForm()
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" {...register('email')} />
```

The visual style stays consistent because every field shares the same Tailwind classes.

### Modals and Dialogs

`dialog.tsx` wraps `@radix-ui/react-dialog` with overlay, content, title and description slots. It already traps focus and restores scroll position. Tailwind classes control z-index, backdrop blur and animations.

### Navigation Components

`menubar`, `dropdown-menu` and `navigation-menu` cover most header and sidebar patterns. Each file exposes compound sub-components so markup remains readable:

```tsx
<NavigationMenu>
	<NavigationMenu.List>
		<NavigationMenu.Item>
			<NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
		</NavigationMenu.Item>
	</NavigationMenu.List>
</NavigationMenu>
```

### Data Display Components

`table.tsx`, `badge.tsx` and `progress.tsx` handle common dashboard widgets. Because styling is Tailwind, you can inject our design tokens (e.g. `bg-brand-600`) without fighting a theming API.

## Theming and Design Tokens

shadcn/ui relies entirely on Tailwind for colours, spacing and radii. Our starter defines tokens in `@theme`:

```css
@theme {
	--radius-lg: 0.75rem;
	--brand-600: 22 119 255;
}
```

Component classes reference tokens through `bg-brand-600` or `rounded-lg`. Variants inside CVA also read tokens, ensuring dark-mode and future re-branding remain single-source.

## Accessibility Defaults and Customization

Radix primitives guarantee:

- **Keyboard navigation** - Tab, Shift-Tab, Arrow keys
- **Focus management** - correct `aria-modal`, focus trap, and restore
- **Screen-reader labels** - each component ships required `role` and `aria-*` attributes

You can add extra labels inline:

```tsx
<Dialog title="Delete account" description="This action is irreversible">
```

Color contrast remains our responsibility. Use Tailwind's `text-brand-foreground` tokens and [eslint-plugin-jsx-a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) to lint contrast.

## Composing and Extending Components

Because each primitive is local code, composition works like ordinary React:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn'; // tailwind-merge helper

export function IconButton(props: ButtonProps & { icon: ReactNode }) {
	const { icon, className, ...rest } = props;

	return (
		<Button className={cn('flex items-center gap-2', className)} {...rest}>
			{icon}
			{props.children}
		</Button>
	);
}
```

For styling, prefer **class-variance-authority (CVA)** over ad-hoc template strings. This keeps variants declarative:

```tsx
const alertVariants = cva('rounded-md border p-4', {
	variants: {
		intent: {
			info: 'border-blue-200 bg-blue-50 text-blue-700',
			warn: 'border-yellow-200 bg-yellow-50 text-yellow-700',
			error: 'border-red-200 bg-red-50 text-red-700',
		},
	},
});
```

## Integrating Animations (Framer Motion)

shadcn/ui does not dictate motion. Wrap primitives with `motion()`:

```tsx
import { DialogContent } from '@/components/ui/dialog'
import { motion } from 'framer-motion'

const MotionDialog = motion(DialogContent)

<MotionDialog
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1,   opacity: 1 }}
    exit={{    scale: 0.9, opacity: 0 }}
    transition={{ duration: 0.15 }}
>
    {children}
</MotionDialog>
```

Because styles are static Tailwind classes, no runtime CSS conflicts with Framer Motion transforms.

## Performance Considerations

- **Bundle size** - no extra JavaScript beyond Radix UI - tree-shake with ES modules
- **No CSS payload** - utilities are already in Tailwind CSS, so adding more primitives does not grow CSS
- **Code splitting** - components are ordinary React, so Next.js can lazy-load pages or sections
- **Server Components** - primitives are compatible because they render to plain HTML without client-side styling logic

## Testing ShadCN Components

- **Unit tests** - use Jest + React Testing Library. Query by role (`getByRole('dialog')`) to verify accessibility
- **Visual regression** - Storybook or Playwright - because variants are deterministic CVA classes, snapshots remain stable
- **Accessibility audits** - `jest-axe` or `@axe-core/playwright` catch contrast and ARIA regressions

## Common Pitfalls and How to Avoid Them

- **Forgotten Tailwind plugin** - the CLI adds `tailwindcss-animate`. If classes like `animate-in` are missing, re-run `shadcn-ui init`
- **Overwriting local edits** - the `add` command asks before overwrite; choose `skip` or `diff`. Keep a dedicated `components/ui/overrides` folder for heavy customisations
- **Naming collisions** - ensure generated files use the same barrel export style as your project (`index.ts`)
- **Dark-mode mismatch** - declare `dark:` variants in CVA early; retrofitting later triggers double work
- **Radix version drift** - pin Radix to the version in `package.json` notes; major bumps can change prop contracts

## Migration Strategy from Other UI Libraries

1. **Audit primitives** - list which Chakra or MUI components you actually use
2. **Generate equivalents** - run `npx shadcn-ui add` for each
3. **Create wrappers** - keep the old prop API but proxy to shadcn primitives so call sites remain unchanged during migration
4. **Map tokens** - translate theme colours and radii into Tailwind config
5. **Remove legacy provider** - delete `ChakraProvider` or `ThemeProvider`, clean up leftover style resets
6. **Measure** - compare bundle size, FCP and Total Blocking Time before deleting the old dependency

## Frequently Asked Questions

- **Do I need to keep the CLI as a dev dependency?**  
  No, the CLI is optional after generation. You can remove it and re-add when you want new components.

- **Can I customise a component beyond recognition?**  
  Absolutely - **it is your file**. The only caveat is losing upstream updates, but because the diff is visible you can manually cherry-pick later.

- **Is shadcn/ui production ready?**  
  All underlying Radix primitives are stable. The glue code is thin. We use it in customer-facing apps without issue.

- **How does this differ from Radix directly?**  
  Radix gives low-level behaviour, shadcn/ui adds Tailwind classes, variants and opinionated composition so you skip repetitive boilerplate.

## Further Reading

- Documentation
  - [Radix UI docs](https://www.radix-ui.com/primitives)
  - [Tailwind Variants docs](https://www.tailwind-variants.org/)
  - [shadcn/ui docs](https://ui.shadcn.com/docs)
- Articles
  - [Design System in React with Tailwind, Shadcn/ui and Storybook](https://dev.to/shaikathaque/design-system-in-react-with-tailwind-shadcnui-and-storybook-17f)
    Tools we use for testing are [React-Testing-Library](https://testing-library.com/docs/) and [Jest](https://jestjs.io/docs/en/getting-started)

## Video guide

If you want to see more practical usage, [here](https://www.youtube.com/watch?v=KfaFyB0uedk) is the recording form JS Standup about next.js testing presented by 🦌. The project tested in the video is LearnReact project.

## Setup

First of all, install Jest:

```bash
pnpm install -D -E jest @types/jest
```

Add a test script to `package.json`:

```js
  "scripts": {
    "test": "jest",

    // optional?
    "test:ci": "jest --ci --coverage",
    "test:update": "pnpm test -- --u",
    "test:watch": "pnpm test -- --watch",
    // ...other scripts
  }
```

Create the `jest.config.js` file in the project root and follow the instructions for the [Rust compiler setup](https://nextjs.org/docs/testing#setting-up-jest-with-the-rust-compiler).

Next, install `react-test-library`:

```bash
pnpm i -D -E @testing-library/react
```

### User events

Use [testing-library/user-event](https://github.com/testing-library/user-event) for mocking events:

```bash
pnpm install -D -E @testing-library/user-event
```

## Utils

### Mock providers and store

While testing, we need to mock various providers like [`<ChakraProvider>`](https://chakra-ui.com/docs/getting-started#setup-provider/). To mock all providers, we can create a `./__tests__/test-utils.tsx` file where we will export the [custom render](https://testing-library.com/docs/react-testing-library/setup/#custom-render) method with all providers:

```tsx
const AllProviders = ({ children }) => <ChakraProvider theme={theme}>{children}</ChakraProvider>;
```

Beside providers, we need to mock the [datx](https://datx.dev/) store:

```tsx
export const StoreMockContext = React.createContext<AppCollection | null>(null);

const withMockStore = (PageComponent: NextPage) => {
	const WithMockStore: FC = (props) => {
		const store: AppCollection = new AppCollection();

		return (
			<StoreMockContext.Provider value={store}>
				<PageComponent {...props} />
			</StoreMockContext.Provider>
		);
	};

	return WithMockStore;
};
```

While testing we can wrap the component in `<StoreMockContext.Consumer>` to get access to the store. The store is needed for mocking the datx model with relationships.

After mocking all providers and the store, we export everything:

```tsx
const customRender = (ui: React.ReactElement, options?: any) =>
	render(ui, { wrapper: withMockStore(AllProviders), ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
```

Now, when testing components we'll import `render` from `__tests__/test-utils.tsx` instead of `@testing-library/react`, like this:

```tsx
import { render } from '__tests__/test-utils';
```

Or if we add `path` to `tsconfig`:

```json
{
  "compilerOptions": {
    ...
    "paths": {
      ...
      "@test-utils": ["__tests__/test-utils.tsx"]
    }
  },
}
```

Then we can import render like this:

```tsx
import { render } from '@test-utils';
```

### Folder structure

All tests should be defined in the same directory where the file being tested is. There is one exception, and that is the `pages` folder because Next.js doesn't allow tests in the `pages` folder. That's why we have the `__tests__` folder in the root of our application.

Example:

```
src
.
├── __mocks__
│   └── react-i18next.tsx
├── __tests__
│   ├── pages
│   │   └── user.test.ts
│   └── test-utils.tsx
├── pages
│   └── user.ts
├── fetchers
│   └── users
│       ├── users.ts
│       └── users.test.ts
└── components
    └── shared
        └── Button
            ├── Button.test.tsx
            └── Button.tsx
```

### `__mocks__`

Manual mocks are used to stub out functionality with mock data. For example, instead of accessing a resource from `node_modules` you might want to create a mock module that allows you to use fake data. Manual mocks are defined by writing a module in the `__mocks__/` subdirectory immediately adjacent to the module. ([docs](https://jestjs.io/docs/en/manual-mocks))

For example, if we want to mock [react-i18next](https://react.i18next.com/), we will create `./__mocks__/react-i18next.tsx`

```tsx
import { I18nextProvider, initReactI18next, setDefaults, getDefaults, setI18n, getI18n } from 'react-i18next';

const useMock = [(k) => k, {}];
useMock.t = (k) => k;
useMock.i18n = {
	language: 'en-GB',
};

module.exports = {
	// this mock makes sure any components using the translate HoC receive the t function as a prop
	withTranslation: () => (Component) => (props) => <Component t={(k) => k} {...props} />,
	useTranslation: jest.fn(() => useMock),

	// mock if needed
	I18nextProvider,
	initReactI18next,
	setDefaults,
	getDefaults,
	setI18n,
	getI18n,
};
```

## Introduction

Based on [the Guiding Principles](https://testing-library.com/docs/guiding-principles/), your tests should resemble how users interact with your code (component, page, etc.) as much as possible. In this context, the user is not the end application user, but some parent component that would use the component that is being tested.

**Query priorities** ([more info](https://testing-library.com/docs/guide-which-query/)):

1. Queries Accessible to Everyone queries that reflect the experience of visual/mouse users as well as those that use assistive technology

   - `getByRole` - this can be used to query every element that is exposed in the accessibility tree. With the `name` option you can filter the returned elements by their accessible name. This should be your top preference for just about everything. There's not much you can't get with this (if you can't, it's possible your UI is inaccessible). Most often, this will be used with the name option like so: `getByRole('button', {name: /submit/i})`. Check the [list of roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques#roles).
   - `getByLabelText` - only really good for form fields, but this is the number one method a user finds those elements, so it should be your top preference.
   - `getByPlaceholderText` - a placeholder is not a substitute for a label. But if that's all you have, then it's better than alternatives.
   - `getByText` - not useful for forms, but this is the number 1 method a user finds most non-interactive elements (like divs and spans).
   - `getByDisplayValue` - the current value of a form element can be useful when navigating a page with filled-in values.

2. Semantic Queries HTML5 and ARIA compliant selectors. Note that the user experience of interacting with these attributes varies greatly across browsers and assistive technology.

   - `getByAltText` - if your element is one which supports `alt` text (`img`, `area`, and `input`), then you can use this to find that element
   - `getByTitle` - the title attribute is not consistently read by screenreaders, and is not visible by default for sighted users

3. Test IDs

   - `getByTestId` - The user cannot see (or hear) these, so this is only recommended for cases where you can't match by role or text or it doesn't make sense (e.g. the text is dynamic).

**Avoid unnecessary "is rendering" test**

Since we have no value in testing whether our component will correctly render, avoid writing these type of tests and focus on more valuable tests instead.

**Avoid destructuring `render` result for querying/finding elements**

It is recommended that you avoid destructuring the `render(...)` result and use `screen` object instead.
To see more info about [why you should use screen](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#not-using-screen), and other common mistakes in RTL usage, please refer to the [Kents](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) blog post.

### Naming Convention

Tests should have meaningful names and should be nested properly by following the next pattern:

1. Root `describe` must be the same as the component/page/hook/util we're testing
2. Nested `describe`s must have the `when` prefix (to indicate specific scenarios)
3. Description of `it` must be a use case sentence

An example:

```tsx
describe('useAuth', () => {
	it('should throw context error', () => {
		// ...
	});
	it('should toggle loading state', () => {
		// ..
	});

	describe('when user exists', () => {
		it('should return the user object', () => {
			// ...
		});
		it('should log out user', () => {
			// ...
		});
	});

	describe('when user does not exist', () => {
		it('should return guest user', () => {
			// ...
		});
		it('should destroy session on window close', () => {
			// ...
		});
	});
});
```

### Basic test example

Base Component:

```tsx
const Button: FC<ButtonProps> = (props) => <button {...props} />;
```

Test:

```tsx
describe('Button', () => {
	// or something more meaningful
	it('should handle click', () => {
		const buttonText = 'click here';
		const testOnClick = jest.fn();

		render(<Button onClick={testOnClick}>{buttonText}</Button>);

		user.click(screen.getByText(buttonText));

		expect(testOnClick).toBeCalledTimes(1);
	});
});
```

**Components that use a base component test example**

Component:

```tsx
import { Button } from 'components/Button';

const UserCard: FC<UserCardProps> = ({ title }) => (
	<Card>
		<h3>{title}</h3>
		<Button>click</Button>
	</Card>
);
```

Test:

Here, the `Button` component is mocked since we only care about the specifics of the `UserCard` component. This is especially useful when you don't want to generate a large tree inside your tests for components that don't have any impact on the actual test.

```jsx
import { screen } from '@testing-library/react';
import { Button } from "components/Button";

jest.mock("components/Button");
(Button as jest.Mock).mockReturnValue(<button />);

describe("UserCard", () => {
  it("should display the correct title", () => {
    const username = "Test User";

    render(<UserCard title={username} />);

    expect(screen.getByText(username)).toBeDefined();
  });
});
```

## Repeated component rendering

Describe your rendering inside `beforeEach` so you could use `screen.{getBySomething}` in your tests later, to reduce number of unnecessary renders.

An example:

```tsx
describe('AlertButton', () => {
	let title: string;
	let confirmButtonText: string;
	let onConfirm: () => void;

	beforeEach(() => {
		title = 'Bonjour';
		confirmButtonText = 'Like, share, subscribe';
		onConfirm = jest.fn();

		render(<AlertButton title={title} confirmButtonText={confirmButtonText} onConfirm={onConfirm} />);
	});

	describe('when clicked', () => {
		beforeEach(async () => {
			await waitFor(() => {
				user.click(screen.getByText(buttonText));
			});
		});

		it('should open alert dialog', () => {
			expect(screen.queryByRole('alertdialog')).toBeNull();
		});
		it('should display correct title', () => {
			expect(screen.queryByText(title)).not.toBeNull();
		});
	});

	describe('when confirm is clicked', () => {
		beforeEach(async () => {
			await waitFor(() => {
				user.click(screen.getByText(buttonText));
			});
		});

		it('should close the dialog', () => {
			expect(screen.queryByRole('alertdialog')).toBeNull();
		});

		// ... more test cases
	});
});
```

> **Note:** This is a shortened example of this concept, you can refer to the standup video section for more info:
> [Next.js testing - Testing shared components](https://youtu.be/KfaFyB0uedk?t=1005)

## Testing user events

User actions are the bread and butter of interactive web applications. Testing user actions means ensuring that when a user clicks, drags, types, or interacts with your application in any way, the app behaves correctly.

**Why is it important?**\
React components often encapsulate user interactions. Imagine a form where a user submits data or a button that toggles a specific state. If these don't work as expected, users can lose trust in our application. Or worse, our brand.

**Testing Flow:**\
To test user actions, you'll usually:

1. Render the component under test.
2. Simulate a user action (like a button click).
3. Check the outcome – this could be a changed state, a rendered element, or an API call.

**Further Exploration:**
We have added a more comprehensive chapter on **Testing User Actions**, providing real-world examples and a guide that will help you ensure your React applications respond correctly to user interactions. You can find it here: [Testing - User actions](/frontend/react/testing/user-actions)

## Page component testing

Pages tests should be located in `src/__tests__/pages` folder because Next.js is not allowing tests in `/pages` folder. Test name should be the same as the page file with `test.tsx` extension.

Page example:

```tsx
const UserPage: NextPage = () => {
	const { data, error } = useSWR<Array<User>, IResponseError>(USER_KEY, fetchUsers);

	if (error) {
		return <ErrorPage />;
	}

	if (!data) {
		return <LoadingPage />;
	}

	return <UserTemplate userList={data} />;
};

export default UserPage;
```

In this page example we should test all three states of the page component. To do that we should mock `<ErrorPage>`, `<LoadingPage>` and `<UserTemplate>` and check if it's rendered based on the fetcher response.

Test example:

```tsx
jest.mock('components/error-page');
jest.mock('components/loading-page');
jest.mock('components/user-template');
jest.mock('fetchers/users');

(ErrorPage as jest.Mock).mockReturnValue(<div data-testid="error-page-testid" />);
(LoadingPage as jest.Mock).mockReturnValue(<div data-testid="loading-page-testid" />);
(UserTemplate as jest.Mock).mockReturnValue(<div data-testid="user-template-page-testid" />);

describe('User Page', () => {
	it('should render error page', async () => {
		(fetchUsers as jest.Mock).mockResolvedValue(new Error('Error occurred!'));

		render(<UserPage />);

		expect(await screen.findByTestId('error-page-testid')).toBeDefined();
	});
	it('should render loading page', async () => {
		(fetchUsers as jest.Mock).mockResolvedValue(null);

		render(<UserPage />);

		expect(await screen.findByTestId('loading-page-testid')).toBeDefined();
	});
	it('should render user page', async () => {
		(fetchUsers as jest.Mock).mockResolvedValue([{ username: 'test user' }]);

		render(<UserPage />);

		expect(await screen.findByTestId('user-template-page-testid')).toBeDefined();
	});
});
```

Because of testing `useSWR` behavior (which will re-render DOM after fetcher promise is resolved), we need to use `findByTestId` method that returns a promise that will resolve when the element is added to DOM.

### SWR testing

To use SWR in your tests, add `SWRConfig` to your `AllProviders` mock with the following setup (note: your cases could require more customization):

```tsx
const AllProviders = ({ children }) => (
	<SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
		<ChakraProvider theme={theme}>{children}</ChakraProvider>
	</SWRConfig>
);
```

With this setup, we are sure that each component we're testing will have its own cache, so we don't have to manually clear the cache before each test.

Check out [this issue](https://github.com/vercel/swr/issues/781) and [this answer](https://github.com/vercel/swr/issues/781#issuecomment-952738214) that explains fixing the known problem.

### Server side rendering

For testing pages that are rendered on server we use [next-page-tester](https://github.com/toomuchdesign/next-page-tester).
It is used for testing pages that fetch data in `getServerSideProps` or `getStaticProps`.

User page example:

```tsx
const UserPage: NextPage<any> = ({ data }) => {
	return <UserTemplate users={data} />;
};

export async function getServerSideProps() {
	const store = new AppCollection();

	const data = await fetchUsers(store);

	return { props: { data } };
}

export default UserPage;
```

Test example:

```tsx
describe('User Page', () => {
	it('displays user data', async () => {
		(fetchUsers as jest.Mock).mockResolvedValue([
			new User({
				id: '1',
				name: 'Test user',
				role: new Role({ name: RoleTypes.User }),
			}),
		]);

		const { render } = await getPage({
			route: '/user',
		});

		render();

		expect(screen.queryByText('Test user')).not.toBeNull();
	});
});
```

## Testing passed props

A quick how to on using Jest to check if correct props are passed to a child component.

This example is purely to show how to verify that a React components props are passed in a Jest unit test. There are two components, a `MyModal` and a `Modal` from Chakra UI library. The `MyModal` renders `Modal` and `Button`, and the 'open' state is handled with `useDisclosure` hook. The goal is to check if `Modal` component gets the `isOpen={true}` prop when the user clicks the button.

```tsx
// MyModal.tsx
export const MyModal: FC<ButtonProps> = (props) => {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<>
			<Button {...props} onClick={onOpen}>
				Open my modal
			</Button>

			<Modal isOpen={isOpen} onClose={onClose}>
				{/* Modal stuff */}
			</Modal>
		</>
	);
};

// MyModal.test.tsx
import { Modal } from '@chakra-ui/react';

jest.mock('@chakra-ui/react', () => {
	const originalImplementation = jest.requireActual('@chakra-ui/react');

	return {
		...originalImplementation,
		Modal: jest.fn((props) => {
			const { Modal: OriginalModal } = jest.requireActual('@chakra-ui/react');

			return <OriginalModal {...props} />;
		}),
	};
});

describe('MyModal', () => {
	it('should open on click', () => {
		render(<MyModal />);

		expect(Modal).toBeCalledWith(expect.objectContaining({ isOpen: false }), expect.anything());

		const button = screen.queryByRole('button');
		expect(button).toBeDefined();

		userEvent.click(button);
		expect(Modal).toBeCalledWith(expect.objectContaining({ isOpen: true }), expect.anything());
	});
});
```

## Fetchers

Fetcher tests should be located in `/fetchers/{{ fetcher name }}` folder next to the fetcher that is tested.

```
...
└── fetchers
    └── users
        ├── user.ts
        └── user.test.ts
```

### Using datx:

When testing fetchers that use Datx, we create mocked store Datx store and instead of making API calls with `request` we need to mock `request` and test the functionality of the fetcher.

In the example below our fetcher fetches one User model and if the user doesn't have a relationship to Role model we add a default one.

```tsx
export async function fetchUser(store: AppCollection, id: string): Promise<User> {
	try {
		const response = await store.request(`users/${id}`, 'GET', undefined, {
			include: ['role'],
		});
		const user = response.data as User;

		if (user.role === null) {
			const newRole = store.add({ name: RoleTypes.User }, Role);
			user.role = newRole;
		}

		return user;
	} catch (resError) {
		throw resError.error;
	}
}
```

Test example:

```tsx
describe('fetchUser', () => {
	it('should return success with only user', async () => {
		const mockStore = new AppCollection();
		const mockUser = mockStore.add({}, User);

		mockStore.request = jest.fn().mockResolvedValue({ data: mockUser });

		const fetchResponse = await fetchUsers(mockStore, '1');

		expect(fetchResponse).toBeInstanceOf(User);
		expect(fetchResponse.role).toBeDefined();
		expect(fetchResponse.role.name).toBe(RoleTypes.User);
	});

	it('should return success with user and role', async () => {
		const mockStore = new AppCollection();
		const mockRole = mockStore.add({ name: RoleTypes.Superadmin }, Role);
		const mockUser = mockStore.add({ role: mockRole }, User);

		mockStore.request = jest.fn().mockResolvedValue({ data: mockUser });

		const fetchResponse = await fetchUsers(mockStore, '1');

		expect(fetchResponse).toBeInstanceOf(User);
		expect(fetchResponse.role).toBeDefined();
		expect(fetchResponse.role.name).toBe(RoleTypes.Superadmin);
	});

	it('should return an error', async () => {
		const mockError = { description: 'Error occurred!' };
		const mockStore = new AppCollection();
		mockStore.request = jest.fn().mockRejectedValue({ error: [mockError] });

		try {
			await fetchUsers(mockStore, '1');
		} catch (fetchError) {
			expect(fetchError.length).toBe(1);
			expect(fetchError[0]).toBe(mockError);
		}
	});
});
```

For more info about testing asynchronous code read [docs](https://jestjs.io/docs/en/asynchronous).

## Mocking API routes

[Mock Service Worker](https://mswjs.io/docs/) is an API mocking library that uses Service Worker API to intercept actual requests.

Example:

```tsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const apiEndpoint = 'http://localhost:3000';

const mockTodoData = [{ title: 'Todo #1', todos: [] }];

const server = setupServer(
	// Describe the requests to mock.
	http.post(`${apiEndpoint}/api/todo-lists`, () => {
		return HttpResponse.json(mockTodoData);
	})
);

beforeAll(() => {
	// Establish requests interception layer before all tests.
	server.listen();
});

afterAll(() => {
	// Clean up after all tests are done
	server.close();
});

test('TodoComponent renders correct number of rows', async () => {
	render(<TodoList />);

	const Rows = screen.getAllByRole('row');
	expect(Rows.length).toBe(1);
});
```

## Hooks

`@testing-library/react` provides `renderHook` and `act` for testing custom hooks. These utilities create a simple test harness that handles running hooks within the body of a function component, as well as providing various useful utility functions for updating the inputs and retrieving the outputs of your custom hook. This approach provides a testing experience as close as possible to how your hook is used in a real component.

### Example hook:

```tsx
function useModal(initialOpen = false) {
	const [isOpen, setOpen] = useState(initialOpen);

	const toggle = useCallback(() => {
		setIsOpen(!isOpen);
	}, [isOpen]);

	const close = useCallback(() => {
		setIsOpen(false);
	}, []);

	return { isOpen, close, toggle };
}
```

### Example test:

```tsx
describe('useModal', () => {
	it('should toggle isOpen on toggle call', async () => {
		const { result } = renderHook(() => useModal());

		await waitFor(() => {
			result.current.toggle();
		});

		expect(result.current.isOpen).toBe(true);
	});

	it('should change isOpen to false on close call', async () => {
		const { result } = renderHook(() => useModal(true));

		await waitFor(() => {
			result.current.close();
		});

		expect(result.current.isOpen).toBe(false);
	});
});
```

### Mock hooks

Sometimes we want our custom hook to return a mock response while we test component consuming it.

Example hook:

```tsx
// @/hooks/useTodos.ts
export const useTodos = (config?: SWRConfiguration) => {
	return useSWR(() => {
		return 'api/todo-lists';
	}, config);
};
```

Example mock and test:

```tsx
import * as hooks from '@/hooks/useTodos';

const mockTodoData = [{ title: 'Todo #1', todos: [] }];

jest.spyOn(hooks, 'useTodos').mockImplementation(() => {
	return {
		data: mockTodoData,
	} as SWRResponse;
});

test('TodoComponent renders correct number of rows', async () => {
	render(<TodoList />); // uses useTodos

	const Rows = screen.getAllByRole('row');
	expect(Rows.length).toBe(1);
});
```

Spy will now redirect any hook calls to mock implementation.
Performance isn’t just about what happens in the browser - it also depends on how efficiently our servers handle requests and generate responses. At Infinum, we've chosen [K6](https://k6.io/) as the default tool for server side performance testing.

## Why K6?

We have chosen K6 for our server-side performance tests for following reasons:

1. Developer-Friendly
   - Written in JavaScript, so frontend and Node.js developers can easily create test scripts.
   - Simple, readable test scripts without heavy configuration files.
2. Lightweight & Fast
   - Designed to handle high loads with minimal overhead.
   - Command-line interface that gives real-time metrics and can fail fast when thresholds aren’t met.
3. [Great for CI/CD Integration](https://grafana.com/docs/grafana-cloud/whats-new/integrate-grafana-cloud-k6-into-your-cicd-pipeline-with-new-k6-github-actions/)
   - Can be run in Docker containers or integrated directly into pipelines (e.g., GitHub Actions, GitLab CI).
   - Supports pass/fail thresholds, making automated testing straightforward.
4. [Rich Metrics & Thresholds](https://grafana.com/docs/k6/latest/javascript-api/k6-metrics/)
   - Built-in metrics for response times (including percentiles), error rates, and more.
   - Define success criteria with thresholds - if performance dips below expectations, tests can fail automatically.

## K6 Functionalities

1. JavaScript Test Scripting
   - Tests are written in _JS/ES6_ modules.
   - Import `http` for requests, `check` for assertions, and other built-in modules to handle data, metrics, etc.
2. Scenarios & Stages
   - K6 supports scenarios where you can define different traffic patterns.
   - Stages allow you to ramp Virtual Users (_VUs_) up or down, hold for a certain duration, and then ramp down.
3. Thresholds
   - A powerful feature letting you specify performance goals in your script.
   - Example: `http_req_duration: ['p(95)<500']` ensures 95% of requests are under 500ms.
4. Metrics & Logging
   - K6 automatically tracks metrics like request duration, error rates, iterations, etc.
   - You can also create custom metrics for specific logic in your test.
5. Docker Integration
   - Official Docker image [grafana/k6](https://hub.docker.com/r/grafana/k6) makes it easy to run tests in a container.
   - Helpful for ensuring consistency in both local and CI environments.
6. Extensions & Libraries
   - K6 has a growing ecosystem of extensions (e.g., for `gRPC` testing, data stores).
   - You can also pull in external libraries for advanced scenarios, though keep in mind K6 runs on a specialized JS runtime [Goja](https://github.com/dop251/goja).

## Quick Start

Below is a minimal example of how to set up and run a simple load test your Next.js application using K6 in a Docker Compose environment. This is just a starting point, production setups might require more configuration.

Also, keep in mind that your Next.js app should be running in a Docker container with production ready type build.

### Project Structure

In your application root directory create `k6` folder, and recreate following structure inside it:

```
(root)
    └── k6
        ├── docker-compose.yml
        ├── README.md
        └── scripts
            └── example.js
```

- `docker-compose.yml`: Defines the K6 service.
- `example.js`: Contains the K6 script.
- `README.md`: (Optional) Document usage or test details.

### Example script

```js
// (root)/k6/scripts/example.js

import http from 'k6/http';
import { check } from 'k6';

// Replace with your own test URL
const TEST_URL = 'https://infinum.com';

export let options = {
	scenarios: {
		soak_test: {
			executor: 'ramping-vus',
			startVUs: 1,
			stages: [
				{ target: 100, duration: '10m' }, // Ramp up to 100 users in 10 minutes
				{ target: 100, duration: '5h' }, // Stay at 100 users for 5 hours
				{ target: 1, duration: '10m' }, // Ramp down to 1 user in 10 minutes
			],
			maxVUs: 100,
		},
	},
};

// Main test function: performs a GET request and checks that the response status is 200.
export default function () {
	const response = http.get(TEST_URL, {
		headers: { Accept: 'application/json' },
	});
	check(response, { 'status is 200': (r) => r.status === 200 });
}
```

### Docker compose

```yml
# (root)/k6/docker-compose.yml

services:
  k6:
    image: grafana/k6:latest
    network_mode: host
    volumes:
      - ./scripts:/scripts
```

### Reading Next.js app resources consumption

In order to find your Next.js app container ID, run following command:

```bash
docker container ls --format "table {{.ID}}\t{{.Image}}\t{{.Names}}"
```

Copy the `CONTAINER ID` of your app, and run following command in terminal:

```bash
docker stats {CONTAINER_ID}
```

The `docker stats` command provides real-time resource usage statistics for running containers. You want to have the stats display in the background while running K6 tests. Here's a breakdown of example output parameters:

1. _CONTAINER ID_
   - `18c1d97a2f8c` → The unique ID of the running container.
2. _NAME_
   - `next-app` → The human-readable name of the container.
3. _CPU %_
   - `5.00%` → The percentage of the host’s CPU currently being used by the container.
   - If it reaches 100%, it means the container is using a full CPU core.
   - If you have multiple cores, the value can exceed 100% (e.g., 200% on a dual-core CPU).
4. _MEM USAGE / LIMIT_
   - `48.45MiB / 61.92GiB`
     - `48.45MiB` → The current memory being used by the container.
     - `61.92GiB` → The maximum memory available to the container (if no limit is set, it defaults to the host’s total memory).
5. _MEM %_
   - `0.08%` → The percentage of the total available memory being used by the container.
   - Calculated as: `(MEM_USAGE / MEM_LIMIT) x 100`
6. _NET I/O_
   - This measures network activity (download/upload).
   - `326kB / 0B`
     - `326kB` → Data received by the container.
     - `0B` → Data sent from the container.
7. _BLOCK I/O_
   - This is useful for monitoring disk activity.
   - `95.6MB / 836kB`
     - `95.6MB` → Data written to disk by the container.
     - `836kB` → Data read from disk.
8. _PIDS (Processes)_
   - Useful for checking if a container has too many or too few processes running.
   - `8` → The number of processes currently running inside the container.

### Running the Test

1. Run the `docker stats` command for your Next.js app.
2. Open your terminal in the `(root)/k6` folder.
3. Run `docker compose run --rm k6 run /scripts/example.js` - this will run the `example.js` script inside K6 container.
4. During the test, you'll see progress / real-time updates.
5. Once the test finishes, you’ll see a summary of metrics.

## Reading K6 output

**During the test**

While the test runs, you’ll see a progress bar or periodic summary lines with metrics like:

- _VU_ (virtual users) count (how many are currently active)
- Iterations (how many total script iterations have run)
- Requests/Second (current throughput)
- Failures or errors encountered

This allows you to monitor the test in real time, especially important if you need to stop or modify the test if unexpected behavior occurs (e.g., the server starts failing rapidly).

**After the test**

After the test completes, K6 prints a detailed report:

![Image with example K6 report](/img/performance-testing/example-output.png)

In this test, we evaluated [Infinum website](https://infinum.com), which is statically generated. While the site itself does not rely on server-side rendering (SSR), we can still analyze the key performance metrics and explain their relevance for SSR applications.

Below is a breakdown of each metric, detailing its significance and how it applies to server-rendered applications.

1. `checks`
   - The number and rate of checks passing or failing. A “check” is a validation in your script - for example, ensuring the response code is _200_ or verifying specific content on the page.
   - In the example, `100.00% 300 out of 300` means all 300 checks passed successfully (no failures).
   - A way to confirm that responses contain the correct data, not just that they came back in time.
   - Helps ensure that your rendered pages contain expected content. If checks fail, it may indicate rendering errors or partial SSR failures.

2. `data_received`
   - The total amount of data received from the server during the test and the average rate (`MB/s` or `KB/s`).
   - In the example,` 86 MB 2.9 MB/s` indicates the test downloaded a total of `86 MB` at `~2.9 MB/s` on average.
   - Shows how large your responses are overall. For SSR, large HTML payloads or big static assets can increase this.
   - If unusually high, consider compression or reducing your rendered content size.

3. `data_sent`
   - The total amount of data sent to the server by K6 and the average rate (MB/s or KB/s).
   - In the example, `514 kB 17 kB/s` indicates the client sent half a megabyte of data, averaging `17 kB/s`.
   - If your test includes POST or PUT requests with large request bodies, this can grow.
   - Normally small for basic `GET` requests in SSR scenarios.

4. `http_req_blocked`
   - The time a request spent in the blocked state before sending. This can include DNS lookups, connection limits, or time waiting for a TCP socket to become available.
   - In the example, the `max=52.83ms` might be from a delayed TCP connection or DNS resolution.
   - High values can indicate network / DNS issues, or local resource limits on connections.
   - For SSR, if you see big spikes, it could add to overall response time, but is often overshadowed by actual rendering time.

5. `http_req_connecting`
   - The time spent establishing a TCP connection. This is a subset of `http_req_blocked`.
   - High `max` can indicate occasional network hiccups or ephemeral port exhaustion.
   - Not typically the main factor in SSR performance, but if extremely high, it can add noticeable delay.

6. `http_req_duration`
   - The total time spent from sending the request to receiving the final byte of the response.
   - One of the most important metrics for SSR because it includes server-side rendering time + network latency + time to receive all data.
   - In the example, an average around `~115ms` might be acceptable, but the `p95` near `145ms` indicates slower requests exist.
   - If these numbers get high (e.g., `500ms+`), users experience slower initial page loads.

7. `{ expected_response:true }`
   - This line indicates the subset of requests that matched a specific tag (in K6 scripts, you can categorize requests).
   - In the example, the stats are the same as the overall `http_req_duration`, meaning all requests were presumably “expected” responses.

8. `http_req_failed`
   - The percentage (or fraction) of failed requests (_4xx/5xx_ status codes or network errors).
   - It indicates whether your service is stable under load. If the error rate spikes under certain concurrency, you’re hitting a bottleneck.
   - A rising failure rate might mean your SSR service (or its dependencies, e.g., databases) cannot handle the load, causing timeouts or internal errors.

9. `http_req_receiving`
   - The time spent receiving the response body from the server, **after the first byte is received**.
   - For SSR pages, large chunks of HTML or significant data in the response can inflate this.
   - Compare with `http_req_waiting` to see if the bottleneck is in server processing or data transfer.

10. `http_req_sending`
    - The time spent sending the request to the server.
    - Large values appear if the request body is big or if there’s a network bottleneck.
    - SSR apps typically doesn’t have large request bodies unless you’re POSTing data.

11. `http_req_tls_handshaking`
    - Time spent performing `TLS/SSL` handshakes.
    - If your app runs over HTTPS (production scenario), this is the overhead for secure connections.
    - Typically small, but spikes (e.g., `27.97ms` in the example) might happen with certain requests or if the environment re-establishes TLS frequently.

12. `http_req_waiting` (a.k.a. [“Time to First Byte” or TTFB](https://developer.mozilla.org/en-US/docs/Glossary/Time_to_first_byte))
    - The time from when the request was sent until the first byte of the response is received (i.e., how long the server took to start sending data).
    - **Extremely relevant for SSR** because _TTFB_ includes server render time. This is often the single biggest indicator of SSR performance issues - if _TTFB_ is high, the user sees a blank page for longer.
    - In the example, `~26ms` is actually quite fast. Notice that it’s significantly lower than the total `http_req_duration`, meaning most of the time is spent receiving the rest of the response (`http_req_receiving`).
    - If _TTFB_ is high, investigate server-side data fetching, CPU usage, or any heavy computation during SSR.

13. `http_reqs`
    - The total count of HTTP requests made during the test.
    - Shows how many requests your application had to handle. In an SSR Next.js context, each page request often triggers SSR logic on the server, so the total request count is how many times your server performed SSR.

14. `iteration_duration`
    - The time (avg, min, med, max) for each iteration to complete. An iteration often includes multiple requests and script logic.
    - If your default function does multiple steps (like logging in, then fetching a page), `iteration_duration` is the total time per _VU_ iteration.
    - Helps correlate how long each user’s “journey” takes.

15. `iterations`
    - The total number of test script iterations run by all Virtual Users (_VUs_).
    - Each iteration typically represents a single run of the default function. If your default function includes multiple HTTP calls, each iteration can yield multiple requests. This helps you track high-level test progress.

16. `vus`
    - Current active Virtual Users (_VUs_) at the time the metrics were captured.
    - Important for load/stress tests. The number of VUs directly impacts concurrency.

17. `vus_max`
    - The maximum number of allocated VUs that K6 could spin up during the test.

18. Some of the metrics also contain following details:
    - `avg` (Average): The mean response time across all requests. Can be skewed if there are few extremely slow or extremely fast requests.
    - `min`: Fastest request time.
    - `med` (Median): Half of your requests are faster than this, half are slower.
    - `max`: Slowest request time.
    - `p(90)`, `p(95)`, `p(99)`: The response time at the 90th, 95th, or 99th percentile. For example, `p(95)=750ms` means 95% of requests completed in 750ms or less, and 5% took longer.

**Most Important Metrics for SSR (Next.js)**

While all of the above metrics can be important, these are **particularly critical** for a server-rendered Next.js application:

1. Time to First Byte (TTFB)
   - Directly reflects how quickly the server can render the initial HTML.
   - A major factor in user-perceived performance: users see a blank screen until TTFB completes.
2. `95th/99th` Percentile Response Time (`p95/p99` of `http_req_duration`)
   - Captures “worst-case” scenarios or how slow the site can be for a significant minority of users.
   - SSR can exhibit high tail latencies if some data fetching is slow or the server is overloaded.
3. `http_req_receiving` - Can reveal if the SSR HTML or data payload is large, which can slow the user from fully loading the page.
4. Request Throughput (`http_reqs`) - SSR is CPU-bound more than static file serving. Knowing how many pages you can serve per second helps capacity planning.
5. Error Rate (`http_req_failed`) - Confirm whether the server or backend dependencies fail under certain loads.

When combined with server-side metrics (CPU, memory, logs), these K6 outputs give a comprehensive view of whether your SSR application scales efficiently and maintains performance for end-users.

## Difference between VUs and Arrival Rate

In K6, you can define your test load in two ways: by specifying Virtual Users (VUs) or by setting an arrival rate.

### VUs

When you use _VUs_, you’re simulating a certain number of concurrent “users” running your script at the same time. For example, you might ramp up from 1 to 50 _VUs_, once a VU finishes all the steps in your script, including any sleeps you’ve coded - it immediately starts the next iteration. This approach helps you understand how your system behaves under a given level of concurrency - ideal if you’re focused on how many people can simultaneously interact with your site.

### Arrival Rate

In contrast, arrival rate focuses on requests per second (or iterations per second). You might tell K6 to generate 100 new requests every second, and it will spin up as many VUs as needed to maintain that rate. This method is useful if you know your expected traffic pattern in terms of throughput, but it offers less direct control over how many users are active at once. If your project has defined an [SLA](https://en.wikipedia.org/wiki/Service-level_agreement) that states, for example, "_Our service must handle 500 requests per second while keeping response times under 300ms._" then focusing on RPS (requests per second) is often the best way to test against that requirement.

## Different types of performance tests

In server-side performance testing, we typically run one or more of the following test types. Each uncovers unique insights into how our application behaves under different load profiles.

### Load Testing

Load testing is about verifying whether an application can comfortably handle the level of traffic you normally expect, or slightly above it. Imagine you run an online store that typically sees 1,000 concurrent users during peak hours. A load test would mimic this traffic profile, gradually ramping up virtual users until you reach that level, then sustaining it for a reasonable duration. You’d be looking at metrics like average response time, error rates, and resource utilization to ensure everything remains stable under these regular load conditions. If performance degrades (e.g., page response times spike or error rates increase) before reaching your known peak, the load test reveals potential bottlenecks that need attention.

![Image with chart explaining load test](/img/performance-testing/load-test.png)

```js
  // Load Testing: Ramping VUs
  load_test: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { target: 50, duration: '10m' }, // Ramp up to 50 users in 10 minutes
      { target: 50, duration: '40m' }, // Stay at 50 users for 40 minutes
      { target: 1, duration: '10m' }, // Ramp down to 1 user in 10 minutes
    ],
    maxVUs: 50,
  },
```

### Soak (Endurance) Testing

While a load test might only run for a few minutes, a soak test extends that duration to multiple hours or even days. The focus here is on identifying issues that accumulate over time. For example, a small memory leak in a server-side application might not be noticeable in a short test, but over several hours of steady traffic, it can lead to crashes or severe slowdowns. In a soak test, the load level might resemble what you see in real-world daily or weekly usage patterns, but the length of the test uncovers hidden resource leaks, database connection saturation, or other stability concerns that only manifest with prolonged stress. For real-world examples of issues detected through soak testing, refer to the [Caching and revalidation](/frontend/react/recipes/caching-and-revalidation#memory-leak-in-nodejs) chapter.

![Image with chart explaining soak test](/img/performance-testing/soak-test.png)

```js
  // Soak Testing: Long Duration Test
  soak_test: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { target: 50, duration: '10m' }, // Ramp up to 50 users in 10 minutes
      { target: 50, duration: '5h' }, // Stay at 50 users for 5 hours
      { target: 1, duration: '10m' }, // Ramp down to 1 user in 10 minutes
    ],
    maxVUs: 50,
  },
```

### Spike Testing

Not all traffic ramps up predictably. Sometimes, your site might receive a sudden influx of visitors - think of a social media post going viral or a limited-time sale starting at a specific moment. Spike testing simulates these abrupt surges. Instead of a gradual increase, the test instantly jumps from a low number of concurrent users to a very high number. The key question is: _How quickly does your system adapt?_ If it can scale rapidly or degrade gracefully without crashing, you pass a spike test. If your response times or error rates skyrocket under the sudden onslaught, it highlights areas that need more robust handling - perhaps better load balancing, caching strategies, or auto-scaling configurations.

![Image with chart explaining spike test](/img/performance-testing/spike-test.png)

```js
  // Spike Testing: Sudden Load Spikes
  spike_test: {
    executor: 'ramping-arrival-rate',
    timeUnit: '1s',
    startRate: 10,
    stages: [
      { target: 50, duration: '10s' }, // Go from 10 to 50 users in 10 seconds
      { target: 0, duration: '10s' }, // Return to 0 users in 10 seconds
      { target: 80, duration: '10s' }, // Go from 0 to 80 users in 10 seconds
      { target: 10, duration: '10s' }, // Return to 10 users in 10 seconds
      { target: 120, duration: '10s' }, // Go from 10 to 120 users in 10 seconds
      { target: 20, duration: '10s' }, // Return to 20 users in 10 seconds
      { target: 180, duration: '10s' }, // Go from 20 to 180 users in 10 seconds
      { target: 20, duration: '10s' }, // Return to 20 users in 10 seconds
    ],
    preAllocatedVUs: 300,
    maxVUs: 1000,
  },
```

### Stress Testing

Where a load test aims to stay at or near expected user volumes, a stress test actively pushes the system beyond its normal limits to find the breaking point. The purpose here is to see how and where your application fails. Does it slow down progressively, or return more errors as usage grows? Maybe it suddenly crash once a certain resource is exhausted? Stress testing can reveal the absolute capacity of your infrastructure and how well it recovers once load is reduced. Knowing these limits helps in planning capacity upgrades, especially if you foresee major traffic spikes in the future or want to ensure business continuity for mission-critical services.

![Image with chart explaining stress test](/img/performance-testing/stress-test.png)

```js
  // Stress Testing: Ramping VUs
  stress_test: {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
      { target: 100, duration: '30s' }, // Ramp up to 100 users in 30 seconds
      { target: 100, duration: '30s' }, // Stay at 100 users for 30 seconds
      { target: 200, duration: '30s' }, // Ramp up to 200 users in 30 seconds
      { target: 200, duration: '30s' }, // Stay at 200 users for 30 seconds
      { target: 300, duration: '30s' }, // Ramp up to 300 users in 30 seconds
      { target: 300, duration: '30s' }, // Stay at 300 users for 30 seconds
      // ... continue to add more stages as needed
    ],
    maxVUs: 500,
  },
```

### Scalability Testing

Even if you know your system’s current capacity, it’s vital to understand whether you can easily scale to handle more traffic. Scalability testing measures how performance metrics like response times or throughput change as you add or remove resources. You might increase the number of application servers or CPU/RAM allocations to see if you achieve linear performance gains. In many real-world cases, performance plateaus or hits diminishing returns because of architectural bottlenecks. By testing different resource configurations, you pinpoint exactly where your system stops scaling effectively. This knowledge ensures you invest in the right optimizations for future growth.

![Image with chart explaining scalability test](/img/performance-testing/scalability-test.png)

```js
  // Scalability Testing: Increasing Load
  scalability_test: {
    executor: 'ramping-vus',
    timeUnit: '1s',
    startRate: 10,
    stages: [
      { target: 50, duration: '1m' },
      { target: 100, duration: '1m' },
      { target: 200, duration: '1m' },
      { target: 300, duration: '1m' },
      { target: 400, duration: '1m' },
      { target: 500, duration: '1m' },
      { target: 550, duration: '1m' },
      { target: 580, duration: '1m' },
      { target: 600, duration: '1m' },
      { target: 610, duration: '1m' },
      { target: 615, duration: '1m' },
      // ... continue to add more stages as needed
    ],
    preAllocatedVUs: 500,
    maxVUs: 1000,
  },
```

## Best Practices & Common Pitfalls

**Don’t Test Directly on Production:**

Hammering your live environment with heavy loads can disrupt real users, inflate costs, or even cause downtime. Instead, use a staging or pre-production environment. If you must test in production, do so off-peak and with strict safeguards.

**Use a Representative Environment:**

Run performance tests on a setup that mirrors production as closely as possible (same server specs, software configuration, and network topology). This ensures that observed performance matches what you’d expect in real-world usage.

**Define Clear Performance Goals & Thresholds:**

Set explicit criteria (e.g., “95% of requests under 500ms”) before testing. This helps you decide quickly if performance is acceptable, and it allows automated pass/fail checks in your CI/CD pipeline.

**Monitor Both System and Test Tool:**

K6 outputs vital metrics, but also watch server resources like CPU, memory and logs. If the server is maxed out, you’ll see performance degrade, even if K6’s request metrics seem fine initially.

**Replicate Realistic User Behavior:**

Users rarely just slam the same endpoint. Script journeys that mimic real navigation patterns, multi-step flows, or different user roles to uncover problems that simpler tests might miss.

**Gradually Increase Load:**

Avoid instantly hitting peak concurrency (unless you’re doing a Spike Test). Ramp up in stages to identify the point at which response times or error rates start to climb.

**Analyze the Entire Performance Picture:**

Look beyond average response times. Check 90th, 95th, or 99th percentile latencies, error rates, and throughput for a more accurate sense of how many users might experience slow or failing requests.

**Keep Tests Versioned & Automated:**

Store test scripts in the same repo as your code and run them regularly (e.g., post-deployment or locally after dependencies updates). Frequent, automated testing catches regressions early and embeds performance checks into your development cycle.

**Watch for Long-Term Effects:**

Short tests might not reveal memory leaks or gradual resource exhaustion. Include soak tests (running hours or days) to detect stability issues that only appear under prolonged load.

**Don’t Rely Solely on Averages:**

A good average can hide tail latencies if a small but significant percentage of requests are very slow. Percentile metrics reveal these outliers.

**Have a Plan for the Results:**

Running tests without acting on the findings wastes time. Investigate performance bottlenecks, then optimize code, queries, caching, or infrastructure. Retest to confirm improvements.

**Collaborate Across Teams:**

Siloed knowledge leads to partial fixes. Share test findings with other developers, QA, ops, and product owners to align on priorities and fix performance holistically.

**Remember Performance Is Ongoing:**

_Applications change over time._ New features, increased traffic, or different infrastructure can reintroduce bottlenecks. Test regularly to maintain a consistently good user experience.

## Introduction to Testing Timers

> JavaScript provides several timing functions that can be used to execute code after a specified period of time or at regular intervals. The most commonly used timers are setTimeout and setInterval. - Tatiana Maslyak, [Mastering Asynchronous Timing](https://marketsplash.com/tutorials/react-js/settimeout-in-react-js/)

## Common use-cases for timeouts

Using timeouts is a common practice, often driven by the need to manage or introduce delays in component behaviors, handle asynchronous operations, or enhance user experience. Here are some typical use-cases for using timeouts in React:

- **Debouncing User Input**: When users type in a search box, instead of making an API call for every keystroke, you might want to wait until the user stops typing to make the call.

- **Displaying Temporary Feedback**: After users submit a form, you want to display a success message that disappears after a few seconds.

- **Handling Animations**: You have an animation or transition effect, and you want to perform some action once the animation completes.

- **Lazy Loading Components or Modules**: To improve initial page load times, you might want to delay the loading of certain non-essential components.

- **Implementing Automatic Session Logout**: For security reasons, you want to automatically log users out after a period of inactivity.

_Remember, these are just a few scenarios. While timeouts can be handy in managing these scenarios, it's essential to handle them correctly, ensuring they are cleared appropriately (using `clearTimeout`) to avoid unwanted side-effects or memory leaks, especially when components unmount._

## The Challenges of Testing Components with Timeouts:

Testing components with timeouts introduces specific challenges that can make the process trickier than testing synchronous operations or even other types of asynchronous behaviors. Let's delve into the challenges posed by timeouts:

- **Non-deterministic Behavior**: Timeouts introduce non-deterministic behavior into components. Since they operate on a delay, tests can become unpredictable, especially if not managed correctly.

- **Difficulties in Reproducing Failures**: Failures in tests involving timeouts can be harder to reproduce consistently. The problem might appear under one condition or system load but not another.

- **Cleanup and Memory Leaks**: If timeouts aren't managed properly, they can continue to run even after a test is finished, leading to side effects that might affect other tests or cause memory leaks.

- **Overhead of Mocking**: To effectively test components with timeouts, developers often have to mock or fake timers. This introduces an overhead in terms of both understanding the mocking tools and ensuring they mimic real-world behavior closely.

- **Over-reliance on Real Timers**: While using real timers (like JavaScript's `setTimeout`) might seem like a straightforward way to test, it's often unreliable. Tests might sometimes fail just because the operation took a millisecond longer than expected.

_Properly mocking and controlling timeouts can lead to more consistent, faster, and reliable tests._

## Utilizing Testing Libraries and Tools

### Jest's Timer Functions

- **`jest.useFakeTimers()`**: This function allows Jest to replace `setTimeout`, `setInterval`, and other timer functions with mock implementations.
- **`jest.runAllTimers()`**: Fast-forward until all timers have been executed.
- **`jest.runOnlyPendingTimers()`**: This runs only the timers that are currently scheduled.
- **`jest.advanceTimersByTime(msToRun)`**: To advance the timers by a specific time, this is useful.
- **`jest.clearAllTimers()`**: Clears all timer callbacks.

### React Testing Library

- **`waitFor` and `waitForElementToBeRemoved`**: These functions allow you to wait for elements to appear or disappear from the DOM, which can be useful for asynchronous UI updates following timeouts.
- **`findBy` queries**: These return a promise that resolves when the element is found, useful for async operations.

## Examples

### Using waitForElementToBeRemoved()

A simple example is waiting for our component to fetch an external resource from an API endpoint (_We are using **MSW** to mock the endpoint_). `waitForElementToBeRemoved` function from React Testing Library, which `awaits` for the `queryByText` to return `true`.

```jsx
import { http, HttpResponse } from 'msw';

it('should show empty state', async () => {
	server.use(
		http.get('/api/lists', () => {
			return HttpResponse.json([]);
		})
	);

	render(<TodoLists />);

	await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

	expect(screen.findByText('Empty List!'));
});
```

### Waiting for setTimeout()

Here we are testing a full flow of a User creating a new Todo Item. The component displays if the user has successfully submitted the form and renders a toast notification using the `setTimeout()` function and removes the notification from the DOM after 3 seconds.

```jsx
jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

it('should add item', async () => {
	const user = userEvent.setup({ delay: null }); // Important to include

	render(<NewItemForm />);

	await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

	await user.type(screen.getByPlaceholderText('Title'), 'List 1');
	await user.type(screen.getByPlaceholderText('Task title'), 'Task 1');

	await user.click(within(createModal).getByRole('button', { name: /Create/i }));

	expect(screen.getByText('Successfully Created New List Item')).toBeInTheDocument();

	// Fast-forward until all timers have been executed
	act(() => jest.runAllTimers());

	expect(screen.queryByText('Successfully Created New List Item')).not.toBeInTheDocument();
});
```

## Best Practices

- **Mock Timers Where Possible**: Instead of waiting for real-time durations, mock timers for faster and more deterministic tests.

- **Clean Up After Each Test**: Always clear any timeouts you've set up to avoid them spilling over to other tests. This can be done using `afterEach` hooks.

- **Avoid Arbitrary Waits**: Using arbitrary `setTimeout` delays in tests to wait for something to happen is a common but bad practice. It makes tests slow and flaky. Instead, use utilities provided by your testing library to wait for specific conditions.

- **Be Aware of External Async Effects**: If a component's asynchronous behavior depends on external factors (like API calls), ensure you mock or stub these out.

- **Test State Transitions**: If timeouts lead to state changes in your components, ensure you test the initial state, the state during the timeout, and the final state after the timeout completes.

- **Cover Branching Logic**: If timeouts lead to branching behaviors (like loading indicators, error messages, etc.), ensure your tests cover all these branches.

_By making the most of the tools at your disposal and adhering to best practices, you can write reliable, fast, and comprehensive tests for asynchronous behavior in your components._

## Suggested Reading

- [Jest: Timer Mocks](https://jestjs.io/docs/timer-mocks)
- [React Testing Library: Using Fake Timers](https://testing-library.com/docs/using-fake-timers/)

## Introduction to Testing User Actions

> The more your tests resemble the way your software is used, the more confidence they can give you. - Kent D. Dodds, creator of React testing Library.

User actions refer to the various ways a user interacts with a web application, often triggering changes in the state of the application or causing certain functions to execute. These actions can include but are not limited to clicking buttons, submitting forms, hovering over elements, dragging and dropping items, and pressing keys. In essence, user actions serve as the bridge between the user and the application, enabling the two-way communication that makes interactivity possible.

These interactions are an integral part of any interactive application for several reasons:

- **Usability**: User actions help in navigating the application, performing tasks, and accessing features. Without the ability to effectively capture and respond to these actions, an app would be static and not user-friendly.

- **Dynamic Content**: Most modern web applications are designed to be dynamic, updating content or changing layout based on user interactions. The handling of user actions is fundamental to this dynamic behavior.

- **Data Capture**: Actions like form submissions are essential for capturing user data, whether it's a simple search query or a complex set of options in a multi-step form.

- **User Experience**: Properly responding to user actions is crucial for providing a positive user experience. For instance, failing to accurately capture and process a click event could result in a frustrating experience for the user.

Given the critical role that user actions play in interactive applications, it's crucial to rigorously test how your application responds to these actions to ensure reliability, accuracy, and a positive user experience.

## Importance of Testing User Actions

Testing user actions is a critical component of ensuring that an application is both reliable and robust for several key reasons:

- **Bug Identification**: Without testing user actions, bugs can easily go unnoticed until the application is in the hands of the user. By then, not only has the user had a frustrating experience, but it's also more costly in terms of both time and resources to fix the issue.

- **Predictable Behavior**: Testing ensures that the application behaves as expected when users interact with it. This predictability is crucial for building user trust and satisfaction. A button should perform the action it's designed for every time it’s clicked, and a form should submit data accurately and reliably.

- **Accessibility**: Testing user actions also ensures that your application is accessible to as many people as possible, including those using assistive technologies. This is not only good practice but also a legal requirement in many jurisdictions.

- **User Experience**: Ultimately, if user actions are not tested properly, the overall user experience suffers. Elements might not be clickable, forms may not submit correctly, and features may not be accessible, all leading to user dissatisfaction.

- **Edge Cases**: Users often interact with applications in unpredictable ways. Thorough testing of user actions helps to uncover edge cases where the application might behave unexpectedly, allowing for preemptive resolution of these issues.

- **Security**: User actions like form submissions can be vulnerable points for attacks such as SQL injection or cross-site scripting. Rigorous testing can help identify and fix these vulnerabilities.

Given these factors, it's evident that testing user actions is not just a good-to-have but a must-have practice for any serious development project. It contributes directly to the application’s reliability and robustness, ensuring that it meets both functional and non-functional requirements.

## Methods for Testing User Actions

The library we will be using is `@testing-library/user-event`. Here's a brief discussion on what `userEvent` is and why it's beneficial for simulating user actions.

### What is `userEvent`?

[userEvent](https://testing-library.com/docs/user-event/intro) is a library that simulates user actions like clicking, typing, tabbing, etc., in a way that closely mimics real user behavior. It builds upon the `fireEvent` utility, also from React Testing Library, but provides a more user-centric experience for simulating events.

### Why Use `userEvent`?

1. **Realistic Simulation:** Unlike simpler methods of event simulation that trigger only individual events, `userEvent` methods generate a sequence of events that more closely mimic user interactions. For example, when you use `userEvent.type`, it doesn't just change the value of an input; it also fires the appropriate `keydown`, `keyup`, and `change` events in the correct sequence.

2. **Ease of Use:** `userEvent` offers a more straightforward, readable API for simulating complex user interactions, making your tests easier to write and understand.

3. **Focus on User Experience:** By simulating the full flow of events triggered by user interactions, `userEvent` helps you catch issues that simpler simulation methods might miss. This leads to a more robust application and better user experience.

4. **Comprehensive Testing:** Using `userEvent`, you can cover various edge cases, like what happens if a user types too quickly, or if they click a button multiple times in rapid succession.

_Suggested reading: [Use @testing-library/user-event over fireEvent where possible.](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#not-using-testing-libraryuser-event)_

### Commonly Used `userEvent` Methods

- **`click(element)`**: Simulates a mouse click event on a given element.
- **`type(element, value)`**: Types the given value into the input element, simulating individual keypress events.
- **`hover(element)`**: Simulates a hover event over a given element.
- **`dblClick(element)`**: Simulates a double-click event on a given element.
- **`clear(element)`**: Clears the content of an input field.
- _See all available methods [here](https://testing-library.com/docs/user-event/convenience)_

### Await

`userEvent` methods return a Promise. The use of `await` in conjunction with `userEvent` often has to do with asynchronous behavior and updates in React.

## Examples

### Testing Button Click

Here's a simple example using Jest and React Testing Library to test a button click:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should update the text', () => {
  	render(<MyButtonComponent />);

  	const button = screen.getByRole('button', { name: /click me/i });
  	await userEvent.click(button);

  	expect(screen.getByText('Button clicked')).toBeInTheDocument();
});
```

In this example, `userEvent.click()` simulates a real user clicking the button, making the test more reflective of actual user behavior.

### Testing Toggle Button

```jsx
it('should render toggle show more/less button', async () => {
	let showMoreButton = screen.getByRole('button', { name: /showmore/i });
	let showLessButton = screen.queryByRole('button', { name: /showless/i });

	expect(showMoreButton).toBeInTheDocument();
	expect(showLessButton).not.toBeInTheDocument();

	await userEvent.click(showMoreButton as HTMLButtonElement);

	showMoreButton = screen.getByRole('button', { name: /showless/i });
	showLessButton = screen.queryByRole('button', { name: /showmore/i });

	expect(showMoreButton).toBeInTheDocument();
	expect(showLessButton).not.toBeInTheDocument();
});
```

_When we are trying to assert elements that are not yet visible on the DOM, we can use the `queryBy_` method variants. Read more about this here: [Using query\* variants](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#using-query-variants-for-anything-except-checking-for-non-existence)\*

### Testing User Navigation

Here is a trickier scenario where we are testing the navigation of the user:

First, we create a Router Mock. This can be done by creating a new file: `__mocks__/router.ts`, which looks something like this:

```jsx
import { NextRouter } from "next/router";

const createMockRouter = (router: Partial<NextRouter>): NextRouter => {
  return {
    basePath: "",
    pathname: "/",
    route: "/",
    query: {},
    asPath: "/",
    forward: jest.fn(),
    back: jest.fn(),
    beforePopState: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
    push: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    defaultLocale: "en",
    domainLocales: [],
    isPreview: false,
    ...router,
  };
};

export default createMockRouter;
```

This allows us to use `Next Router` when testing for User Navigation. Look at the example code below:

```jsx
import { RouterContext } from 'next/dist/shared/lib/router-context';
import createMockRouter from '__mocks__/router';

const router = createMockRouter({});

it('should navigate to register page', async () => {
	const user = userEvent.setup();

	render(
		<RouterContext.Provider value={router}>
			<LoginForm />
		</RouterContext.Provider>
	);

	await user.click(screen.getByRole('link', { name: /Register/i }));

	expect(router.push).toHaveBeenCalled();
});
```

### Testing Form Submit

Many times, we have complex forms that are very important to our business running smoothly, so we can't risk them not working. Here is how we can write a simple test for a form:

First, we set up **MSW** (Mock Service Worker) to handle API requests made by the form. This will ensure we have more control over the responses, so we can test for different scenarios.

```jsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
	http.post(testApiUrl('/api/login'), () => {
		return HttpResponse.json(true, { status: 200 });
	})
);

beforeAll(() => {
	server.listen();
});

afterEach(() => {
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});
```

After, we can test the Login form that hits the `/api/login` endpoint:

```jsx
import { FormProvider, useForm } from 'react-hook-form';

it('should submit form', async () => {
	const user = userEvent.setup();
	const methods = useForm();

	return (
		<FormProvider {...methods}>
			<LoginForm />
		</FormProvider>
	);

	const emailInput = screen.getByRole('textbox', { name: /Email Address/i });
	const passwordInput = screen.getByPlaceholderText('Enter Password');

	await user.type(emailInput, 'test@infinum.com');
	await user.type(passwordInput, 'password');

	await user.click(screen.getByRole('button', { name: /Submit/i }));

	expect(screen.getByText('Login Successful.')).toBeInTheDocument();
});
```

## Best Practices

Testing user actions is an essential part of ensuring that your web application is robust and user-friendly. However, the way you approach this testing can have a significant impact on its effectiveness. Below are some do's and don'ts to consider when testing user actions in your application.

### Do's:

1. **Always use userEvent**: Use `userEvent` to simulate user actions as closely as possible to how a real user would interact with the application.

2. **Do Use Realistic Test Data**: Use data that closely mimics what actual users would input. This makes your tests more reliable and likely to catch edge cases.

3. **Do Test Multiple User Flows**: Don't just test the "happy path." Consider different user behaviors, such as what might happen if a user double-clicks a button, inputs invalid data, or tries to submit a form without filling it out.

4. **Do Check for Accessibility**: Use tools and techniques to ensure that your application is accessible. Test keyboard navigation, screen reader compatibility, and other accessibility features.

5. **Do Test Asynchrony**: If the user action triggers asynchronous operations like API calls, make sure to account for that in your tests.

6. **Do Validate UI Changes**: After a user action, check that the UI updates as expected. This could involve new elements becoming visible, text changing, or items being added to a list.

7. **Do Use Descriptive Test Names**: Make sure that the names of your test cases clearly indicate what is being tested.

### Don'ts:

1. **Don't Only Test the JavaScript**: While it’s crucial to test how your JavaScript handles user actions, don’t forget to test the end result from a user’s perspective, such as whether the correct page elements are displayed.

2. **Don't Ignore Edge Cases**: Users rarely follow the exact path you expect them to. Always test edge cases to make sure your application can handle them gracefully.

3. **Don't Assume Users Will Follow Instructions**: Users might not use your application the way you intend. Test for unintended or incorrect user actions as well.

4. **Don't Rely Solely on Unit Tests**: While unit tests are helpful, they can't capture the full range of user interactions with your application. Make sure to include integration and end-to-end tests.

5. **Don't Hardcode Test Data**: Hardcoding values can make your tests brittle and less reusable. Whenever possible, generate test data programmatically or fetch it from a controlled source.

6. **Don't Skip Cleanup**: Make sure to reset any changes your tests make to the application state so that one test doesn't affect the outcome of another.

By keeping these do's and don'ts in mind, you'll be better equipped to write effective tests for user actions, leading to a more robust and reliable application.

## Suggested Reading

- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Avoid Nesting when you're Testing](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)
- [Static vs Unit vs Integration vs E2E Testing for Frontend Apps](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests)
- [Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch)
- [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Write fewer, longer tests](https://kentcdodds.com/blog/write-fewer-longer-tests)
- [Test Isolation with React](https://kentcdodds.com/blog/test-isolation-with-react)
- [How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test)
  ![](https://infinum.com/handbook/dist/assets/images/books/frontend/header.svg?59a036660281a9152d1e8329f23182fe)

# Frontend handbook

Our handbook based on 10 years of experience in Frontend/JS development. We try to document our way of working and writing code here. As this might change feel free to watch this space regularly.

## Contributing

We welcome all contributions from both the public and Infinum members. Feel free to open up the pull request with your ideas/articles/chapters, or what ever you want to see merged.

In recommended extensions you can find `vscode-remark`, which is used to check (lint) and format markdown files from within your editor, you should install it before working with chapters.

If you want to add a new chapter, you can do it in [frontend-handbook-private](https://github.com/infinum/frontend-handbook-private) repository `chapters.yml` file.

## Discussions

If you want to discuss something, or propose a more general change feel free to use [Github Discussions](https://github.com/infinum/frontend-handbook/discussions) for this.

## Credits

Infinum Frontend Handbook is maintained and sponsored by [Infinum](https://www.infinum.com).

<p align="center">
  <a href='https://infinum.com'>
    <picture>
        <source srcset="https://assets.infinum.com/brand/logo/static/white.svg" media="(prefers-color-scheme: dark)">
        <img src="https://assets.infinum.com/brand/logo/static/default.svg">
    </picture>
  </a>
</p>

## Licensing

All rights reserved.
**Don't ever use tag selectors if they can be avoided**. They are usually much slower than any class selector, and almost always have to be overridden.

It is strongly recommended to use Stylelint to force nesting, specificity, rule order, and other rules in the following chapter.

[stylelint-scss](https://www.npmjs.com/package/stylelint-scss)

- [Nesting](#nesting)
- [Specificity](#specificity)
- [Rule order](#ruleOrder)
- [File length](#fileLength)

<a name="fileLength"></a>

### File length

An SCSS file should never be more than 200 lines long. Longer files are harder to read and find selectors and rules in. Optimal length would be around 100
lines per file. Very complicated blocks with more than 50 lines should go in their own separate file. It would be best to put it under a folder with the name of the page it's on,
if it's not a component.

<a name="nesting"></a>

### Nesting

Nesting improves code readability, but it must be used in moderation. The rule is to nest no more than three times, with few exceptions.
The usual example of three-level nesting is found in a simple block element with a modifier.

```scss
.block {
	//level 1 nesting

	.block__element {
		//level 2 nesting

		&.block__element--modifier {
			//level 3 nesting
		}
	}
}
```

<a name="specificity"></a>

### Specificity

Specificity is a bit more complex than nesting. With specificity, you have to take into account the generated CSS output. Each level of nesting adds a level of specificity to a selector. Adding multiple selectors on a single line also adds to specificity. For example:

```scss
//level 1 specificity
.button {
	//properties...
}

//level 2 specificity
.button.button-white {
	//properties...
}
//or
.button {
	.button-white {
		//properties...
	}
}

//level 3 specificity
.button.button-white.button-really-white {
	//properties...
}
//or
.button {
	&.button-white {
		.button-really-white {
			//properties...
		}
	}
}
```

**There should be no more than four levels of specificity.**

<a name="ruleOrder"></a>

### Rule order

The rule order inside a selector is as follows:

- extends
- includes without @content
- properties
- nested properties
- includes with @content
- pseduoclasses (e.g. :hover)
- pseudoelements (e.g. ::after)
- parent selector modifiers (e.g. &.is-active)
- children element selectors

This will be enforced by the scss-lint.
_Guides are not rules and should not be followed blindly. Use your head and think._

In all web projects, we usually have some kind of a css/sass folder, whose name can sometimes be chosen. The usual names would be:

- Stylesheets
- Styles
- CSS
- SASS

Brush up on Sass partials and imports if necessary, as those are important to understand the file structure.
If the app is a Rails app, sprockets can be used instead of imports; differences will be noted when necessary.

Because of the BEM philosophy, files will usually follow the structure of components (that is, blocks). Here is an example of their structure:

- **vendor**
  - normalize.css
  - other-vendor.css
  - ...
- **overrides**
  - normalize.scss
  - other-vendor.css
  - ...
- **utils**
  - \_colors.scss
  - \_z-indexes.scss
  - \_shared-variables.scss
  - \_media.scss
  - \_placeholders.scss
  - \_mixins.scss
  - \_fonts.scss
  - \_animations.scss
- **components**
  - \_header.scss
  - \_nav-list.scss
  - \_article.scss
  - ...
- **pages**
  - \_homepage.scss
  - \_about-us.scss
  - \_some-other-page.scss
  - ...
- \_config.scss
- \_core.scss
- \_shame.scss
- application.scss

Only the main file (application.scss in the example above) should be a normal Sass file, everything else should be a partial. This is so only one CSS file is generated, and when a file is not imported, it will not be unnecessarily compiled.

The application.scss file should only hold imports. No actual rules, styling, variables, mixins, etc. can go in it. Usually, it looks something like this:

```css
@import 'vendor/**/*';
@import 'overrides/**/*';

@import 'config';
@import 'utils/**/*';

@import 'core';

@import 'components/**/*';
@import 'pages/**/*';

@import 'shame';
```

If everything is done correctly, load order shouldn't matter, so using wildcards is recommended in sass-rails projects. If you are using LibSass, it might not work (currently it doesn't), so files need to be imported individually. The recommended way of solving the LibSass problem would be using folder name files to load. For example:

- **folder**
  - \_first.scss
  - \_second.scss
- \_folder.scss
- application.scss

the `folder.scss` file would contain:

```css
@import 'folder/first';
@import 'folder/second';
```

and the `application.scss` file would contain:

```css
@import 'folder';
```

**If using sprockets**, the `application.scss` file would contain the Rails way of importing using require. Variables and other defines won't carry over to files, so they would have to be @imported manually as needed.

### Vendor and overrides

The vendor folder should have CSS or SCSS files that are obtained from outside sources. As these files have nothing to do with the application styling, they should be loaded first.

Overrides are files that directly override vendor classes. For example, Bootstrap's `modal` class would be overridden in the `bootstrap.scss` inside the override folder with the `modal` class.

Any global overrides for the vendor files should go into the override folder with the same name as the vendor file, so that they can be easily found when necessary.

### Core and config

The config file should contain the configuration for the imported vendors (Susy would be a typical example) or other configuration for user-defined mixins, functions, etc.

The core file should contain globally defined styles for the application. That could mean setting a global font size, adding global box sizing, etc. The core file should not contain any configurations or mixins, variables and such, only styling (or includes of such).

### Components

The components folder contains blocks that are shared between pages. Those could be form definitions, button definitions, and similar. Each component has to be in its own file, with the name of the file matching that of the block.

### Pages

The pages folder contains an SCSS file for each page on a site. The styles inside should be specific to that page, while still following the BEM philosophy. Any blocks that will be shared between pages are placed into the components folder in a separate file, and not inside a specific page. The name of the file should match the page handle.

### SHAME

The `_shame.scss` file is to be used only for hackity hack code that really shouldn't be put in any other file. Using it is not recommended but is sometimes necessary. When writing a rule in the shame file, **ALWAYS** put a comment above it stating specifically why it was written, and what problem it solved. Don't be afraid to write multiple lines to explain it.

When you're working on a project with `_shame.scss`, always check the file when you have strange behavior, or if you're removing something from it, fix the underlying issue it was trying to solve.

### Utils

- colors
- z-indexes
- shared variables
- media
- placeholders
- mixins

### Colors

The colors file should only contain color variables of the base and global kind.
All colors for blocks or elements should go into their local file on the top.

Base colors are actual color values used on the site. They will be used by both global colors and block-element colors.

Avoid using names that correspond to the actual colors when naming color variables. Better use something like `rouge`, `wood`, `mercury`, etc.

Syntax and example:

Syntax: `base-[value]-color`

```scss
$base-rouge-color: #ff0000;
```

It is OK to use the name of the color only in base colors.

Global colors are colors to be used for block- or element-level colors. They should contain base colors.

Syntax: `[primary, secondary, ternary ...]-<property>-color`

```scss
$primary-color: $base-red-color;
$primary-text-color: $base-light-gray-color;
```

Block element colors go into their respective files on the top and are defined as such:

Syntax: `[block-name][__element-name]-<property>-color`

```scss
$some-block-background-color: $base-red-color;
$some-block__some-element-color: $primary-text-color;
```

Text is the only property that can be omitted, as its property name in CSS is a color as well.

### Z-indexes

When using z-indexes, use z-index variables defined in the z-index file.

```scss
$z-base: inital;
$z-modal: 10;
$z-loader: 20;
$z-modal-raised: 30;
$z-notification: 40;
$z-debug: 1000;

//For use in local situations only (inside of a specific block or element)
$z-1: 1;
$z-2: 2;
$z-3: 3;
$z-4: 4;
$z-5: 5;
```

### Shared variables

This file should contain only variables that will be shared across SCSS files, and doesn't include colors, z-indexes, media queries, or similar.
Example:

```scss
$global-header-height: 250px;
```

Use a global prefix so that it is clear where the definition is when it is used in other files.

### Media queries

A media file should contain the variables and mixins used to define the media queries and breakpoints on the site.

**Using the media [mixin](https://github.com/infinum/media-blender) is strongly recommended as it is explicit and will standardize media queries.** The README in the repository explains configuration and usage of the mixin.

Otherwise, syntax is as follows:

[SASS reference on mixins](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#mixins)

```scss
$breakpoint-tablet: '(max-width: 991px)';

@mixin tablet() {
	@media #{$breakpoint-tablet} {
		@content;
	}
}
```

### Placeholders

The placeholders file should contain globally shared pseudoclasses (or placeholders). Pseudoclasses in SASS are classes beginning with %, which generate no CSS
output but can be extended using the SASS directive @extend.

Examples of using a global placeholder:

- [SASS reference on pseudoclasses](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#placeholder_selectors_)
- [SASS reference on extend](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#extend)
- [SASS reference on usage of pseudoclasses](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#placeholders)

```scss
%container {
	@include container;
	width: $content-width-large;

	@include desktop {
		width: $content-width-desktop;
	}
	@include tablet {
		width: $content-width-tablet;
	}
	@include mobile {
		width: $content-width-mobile;
	}
}

//Or with media mixin
%container {
	@include container;
	width: $content-width-large;

	@include media(desktop) {
		width: $content-width-desktop;
	}
	@include media(tablet) {
		width: $content-width-tablet;
	}
	@include media(mobile) {
		width: $content-width-mobile;
	}
}
```

### Mixins

The mixins file should contain any global mixin that can help organize SASS better. If your project contains a lot of mixins, it is recommended that you put them in separate files and group them according to their purpose. Then put all those files inside a new folder called **mixins**.

For instance, adding clearfix:

```scss
@mixin clearfix() {
	&::after {
		content: ' ';
		display: table;
		clear: both;
	}
}
```

Example of structure:

- **utils**
  - **mixins**
    - \_buttons.scss
    - \_containers.scss
    - \_forms.scss
    - \_general.scss
    - \_sections.scss
    - \_typography.scss

### Fonts

The fonts file should contain any and all font family declarations.

If the font has multiple weights, always use the same font family name, with different font-weight values. **Font-weight values should always use named weights**. The same goes for using fonts in other SCSS code. Exceptions can be made if the font has more than 3 weights or abnormal weight distribution.

The other part of the font file should contain font family pseudoclasses for using the fonts. Pseudoclasses should not contain any weight or size properties—those belong in the classes that use the font.

Name the font family pseudoclasses with primary, secondary, and so on.
The primary should usually refer to the heading font and the secondary to the standard (body text) font.

For example:

```css
@font-face {
	font-family: 'some-font';
	src: url('some-font-regular.eot');
	src:
		url('some-font-regular.eot?#iefix') format('embedded-opentype'),
		url('some-font-regular.woff2') format('woff2'),
		url('some-font-regular.woff') format('woff'),
		url('some-font-regular.ttf') format('truetype');
	font-weight: normal;
	font-style: normal;
}

@font-face {
	font-family: 'some-font';
	src: url('some-font-bold.eot');
	src:
		url('some-font-bold.eot?#iefix') format('embedded-opentype'),
		url('some-font-bold.woff2') format('woff2'),
		url('some-font-bold.woff') format('woff'),
		url('some-font-bold.ttf') format('truetype');
	font-weight: bold;
	font-style: normal;
}

//primary font should refer to the heading fonts if such exist
%primary-font {
	font-family: 'some-font';
}

//secondary font is the body fonts
%secondary-font {
	font-family: 'some-other-font';
}
```

If your project uses PostCSS, there are libs that will make all these font-face declarations for you.

### Animations

The animations file should contain all keyframes definitions in the project, as well as the mixins necessary for using the keyframe. Avoid animating anything besides transforms and opacity, as these are the least expensive operations.

Animations should be prefixed with the keyframe prefix, while mixins that use it should be prefixed with an animation.

```css
@keyframes keyframe-move-down {
	0% {
		transform: translate(0, 0);
	}

	100% {
		transform: translate(0, 100%);
	}
}

@mixin animation-move-down() {
	animation-name: keyframe-move-down;
	animation-duration: 3s;
}
```

### SASS style guide

For a reference of SASS functionality, refer to this page: [SASS reference](http://sass-lang.com/documentation/file.SASS_REFERENCE.html)

_This should cover almost all cases of writing Sass, including file structures, imports, code organization, and logic._

We use scss-lint and csscomb as our linter and code style checker. Dotfiles for these can be found in the [Useful links guide](/books/frontend/Useful-links)
Based on the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).

## [References](#references)

Avoid using `var`. If you're working with values that don't change, use `const`. In other cases, use `let`.

Note that both `let` and `const` are block-scoped.

```js
// const and let only exist in the blocks they are defined in.
{
	let a = 1;
	const b = 1;
}
console.log(a); // ReferenceError
console.log(b); // ReferenceError
```

Also, keep [temporal dead zones](http://jsrocks.org/2015/01/temporal-dead-zone-tdz-demystified/) in mind.

```js
// const and let don't exist before they're defined.
{
	console.log(a); // ReferenceError
	console.log(b); // ReferenceError
	let a = 1;
	const b = 1;
}
```

## [Objects](#objects)

Use computed property names when creating objects with dynamic property names.

```js
function getKey(k) {
	return `a key named ${k}`;
}

// bad
const obj = {
	id: 5,
	name: 'San Francisco',
};
obj[getKey('enabled')] = true;

// good
const obj = {
	id: 5,
	name: 'San Francisco',
	[getKey('enabled')]: true,
};
```

Use object method shorthand.

```js
// bad
const atom = {
	value: 1,

	addValue: function (value) {
		return atom.value + value;
	},
};

// good
const atom = {
	value: 1,

	addValue(value) {
		return atom.value + value;
	},
};
```

Use property value shorthand. Group your shorthand properties at the beginning of your object declaration.

```js
const anakinSkywalker = 'Anakin Skywalker';
const lukeSkywalker = 'Luke Skywalker';

// bad
const obj = {
	episodeOne: 1,
	twoJediWalkIntoACantina: 2,
	lukeSkywalker: lukeSkywalker,
	episodeThree: 3,
	mayTheFourth: 4,
	anakinSkywalker: anakinSkywalker,
};

// good
const obj = {
	lukeSkywalker,
	anakinSkywalker,
	episodeOne: 1,
	twoJediWalkIntoACantina: 2,
	episodeThree: 3,
	mayTheFourth: 4,
};
```

Quote only properties that are invalid identifiers.

## [Arrays](#arrays)

Use array spreads `...` to copy arrays.

```js
// bad
const len = items.length;
const itemsCopy = [];
let i;

for (i = 0; i < len; i++) {
	itemsCopy[i] = items[i];
}

// good
const itemsCopy = [...items];
```

To convert an array-like object to an array, use Array#from.

```js
const foo = document.querySelectorAll('.foo');
const nodes = Array.from(foo);
```

## [Destructuring](#destructuring)

Use object destructuring when accessing and using multiple properties of an object.

```js
// bad
function getFullName(user) {
	const firstName = user.firstName;
	const lastName = user.lastName;

	return `${firstName} ${lastName}`;
}

// good
function getFullName(user) {
	const { firstName, lastName } = user;
	return `${firstName} ${lastName}`;
}

// best
function getFullName({ firstName, lastName }) {
	return `${firstName} ${lastName}`;
}
```

Use array destructuring.

```js
const arr = [1, 2, 3, 4];

// bad
const first = arr[0];
const second = arr[1];

// good
const [first, second] = arr;
```

Use object destructuring for multiple return values, not array destructuring.

```js
// bad
function processInput(input) {
	// process the input and return necessary properties
	return [left, right, top, bottom];
}

// the caller needs to think about the order of return data
const [left, __, top] = processInput(input);

// good
function processInput(input) {
	// process the input and return necessary properties
	return { left, right, top, bottom };
}

// the caller selects only the data they need
const { left, right } = processInput(input);
```

When programmatically building up strings, use template strings instead of concatenation.

```js
// bad
function sayHi(name) {
	return 'How are you, ' + name + '?';
}

// bad
function sayHi(name) {
	return ['How are you, ', name, '?'].join();
}

// good
function sayHi(name) {
	return `How are you, ${name}?`;
}
```

## [Functions](#functions)

Never use `arguments`; opt to use rest syntax `...` instead.

```js
// bad
function concatenateAll() {
	const args = Array.prototype.slice.call(arguments);
	return args.join('');
}

// good
function concatenateAll(...args) {
	return args.join('');
}
```

Use default parameter syntax rather than mutating function arguments.

```js
// really bad
function handleThings(opts) {
  // No! We shouldn't mutate function arguments.
  // Double bad: if opts is falsy, it'll be set to an object which may
  // be what you want but it can introduce subtle bugs.
  opts = opts || {};
  // ...
}

// still bad
function handleThings(opts) {
  if (opts === void 0) {
    opts = {};
  }
  // ...
}

// good
function handleThings(opts = {}) {
  // ...
}

Always put the default parameters last.

// bad
function handleThings(opts = {}, name) {
  // ...
}

// good
function handleThings(name, opts = {}) {
  // ...
}
```

## [Arrow functions](#arrow-functions)

Use arrow functions for anonymous function expressions.

```js
// bad
[1, 2, 3].map(function (x) {
	const y = x + 1;
	return x * y;
});

// good
[1, 2, 3].map((x) => {
	const y = x + 1;
	return x * y;
});
```

If the function body consists of a single expression, omit the braces and use implicit return.

```js
// good
[1, 2, 3].map((number) => `A string containing the ${number}.`);

// bad
[1, 2, 3].map((number) => {
	return `A string containing the ${number}.`;
});

// good
[1, 2, 3].map((number) => {
	const nextNumber = number + 1;
	return `A string containing the ${nextNumber}.`;
});
```

Ensure clarity between arrow functions and comparison operators.

```js
// bad
const itemHeight = (item) => (item.height > 256 ? item.largeSize : item.smallSize);

// bad
const itemHeight = (item) => (item.height > 256 ? item.largeSize : item.smallSize);

// good
const itemHeight = (item) => {
	return item.height > 256 ? item.largeSize : item.smallSize;
};
```

## [Modules](#modules)

Always use modules (`import`/`export`) over a non-standard module system. You can always transpile to your preferred module system.

```js
// bad
const AirbnbStyleGuide = require('./AirbnbStyleGuide');
module.exports = AirbnbStyleGuide.es6;

// ok
import AirbnbStyleGuide from './AirbnbStyleGuide';
export default AirbnbStyleGuide.es6;

// best
import { es6 } from './AirbnbStyleGuide';
export default es6;
```

## [Variables](#variables)

Group all your const declarations together and then group all your let declarations together for better readability.

```js
// bad
let index,
	total,
	projectName,
	data = fetchData(),
	isActive = true;

// bad
let index;
const data = fetchData();
let projectName;
const isActive = true;
let total;

// good
const isActive = true;
const data = fetchData();
let projectName;
let index;
let total;
```

## [Trailing commas](#commas)

Using an additional trailing comma in objects, arrays, and function parameters can lead to cleaner git diffs and improve code maintenance. Here's why:

1. Cleaner Git Diffs: Adding a trailing comma minimizes the number of lines changed when new elements are added, making it easier to review code changes.
2. Consistency: Ensures a consistent style in your codebase, which can improve readability.
3. Transpiler Support: Transpilers like Babel will remove trailing commas in the transpiled code, ensuring compatibility with older browsers.

**Example: Objects**

```js
// Bad - without trailing comma
const hero = {
	firstName: 'Florence',
	lastName: 'Nightingale',
};

// Good - with trailing comma
const hero = {
	firstName: 'Florence',
	lastName: 'Nightingale',
};
```

**Example: Arrays**

```js
// bad
const heroes = ['Batman', 'Superman'];

// good
const heroes = ['Batman', 'Superman'];
```

**Example: Function Parameters**

```js
// bad
function createHero(firstName, lastName, isHero) {
	// ...
}

// good
function createHero(firstName, lastName, isHero) {
	// ...
}
```

## [Naming conventions](#naming-conventions)

Naming functions is a critical and often challenging aspect of programming. Clear and descriptive function names improve readability and maintainability of the code. Here are some best Practices for naming functions:

### Naming functions

**Descriptive and Specific:**
Function names should clearly describe what the function does. Use verbs to name functions that perform actions. Avoid vague names.

```js
// bad
function process() {
	// ...
}

// good
function calculateTotalPrice() {
	// ...
}
```

**Avoid Abbreviations:**
Use full words to avoid confusion.

```js
// bad
function calcTtl() {
	// ...
}

// good
function calculateTotal() {
	// ...
}
```

### Naming variables

**Use Clear and Descriptive Names:**

```js
// bad
let x = 10;
let y = 20;

// good
let width = 10;
let height = 20;
```

**Use Meaningful Context:**

Include context to avoid ambiguity.

```js
// bad
let temp = 98;

// good
let bodyTemperature = 98;
```

**Combining Best Practices**

```js
// bad
function calc() {
	let w = 10;
	let h = 20;
	return w * h;
}

// good
function calculateArea() {
	const width = 10;
	const height = 20;
	return width * height;
}
```

## Testing

> Guidelines are not rules and should not be followed blindly.
>
> Use your head and think.

You might assume that testing should be exclusively conducted by specialized testers, but that's not the case. As a developer, you should also test applications. You may utilize different tools and principles, but ensuring that your applications are covered with tests is imperative.

Tests are essentially snippets of code checking other code, ensuring that your application behaves as expected.

Just as you would inspect or test your car before a road trip or equipment before a presentation, your code should receive the same attention to detail.

Testing is a skill that requires continuous practice.

Write tests, then write more tests, and soon enough, you'll become an unstoppable developer.

Knowing whether some code is functioning correctly can be easily determined by running your tests while enjoying a sip of coffee or tea. This will instill great confidence in writing more code or refactoring existing code.

### What is testing and why is it important?

This is a seemingly simple question with a simple answer.

Testing, also known as software testing in our domain, is a method to ensure that software is free of errors, bugs, and defects by identifying and rectifying them before deployment and use by users. It also aids in identifying missing or partially implemented requirements.

Software can be tested manually by running it and checking all its parts, or you can automate this process by writing tests.

In our development domain, tests are essentially code - functions and variables - used to test other production functions and variables.

You employ various approaches, or a combination thereof, to ensure that your code doesn't crash or behave unexpectedly and that it functions as your requirements specify once in production.

There are numerous approaches to ensuring stable software, which can be categorized and grouped in various ways.

Now, why is testing important?

Because bugs can result in financial losses, such as in stock exchanges or bank accounts, and more importantly, software malfunctions can endanger lives. In 1985, several patients died due to a radiation overdose caused by a race condition in code. In 1994, an airplane crashed, resulting in the deaths of 264 people, due to a bug. That same year, a helicopter crashed, killing 29 people because of a malfunctioning flying system. The list goes on.

You might be thinking that small projects or projects that seemingly pose no danger won't have consequences, but losing users and clients is something you definitely want to avoid.

Ultimately, will your boss be pleased with you for developing faulty software?

Or perhaps you believe that testing will prolong software delivery time and slow down the process. However, searching for a single character bug that disrupts the flow of a large application is far more time-consuming, expensive, and stressful.

### Types of testing

There are lots of types, categories, groupings, and ways of testing, again we are referring to software testing.

We will mention some of them, but feel free to look on the Internet for more because the list can go long and classification can vary.

Common types you will find are:

**Unit testing**

Unit testing is testing the smallest testable part like a function or method.
You usually check if for specific input, to a function for example, you get specific output.
Or if function returns nothing, you might test if something else was done inside its body like other
function call or some variable being modified.
Unit testing is usually done by the same developers who wrote the code.

One thing to remember is that you do not test code that is not yours.
You do not test if React will call componentDidMount or not, or that JSX will be compiled correctly,
or that some external function will do whatever it should be doing.
External libraries and code should already have their tests.
This will be emphasized again later.

**Integration testing**

Since we know what are unit tests, we can now describe what are integration tests and what is
integration testing.
Basically, it is testing of units combined and tested as a group.
Purpose of these tests are checking if interaction between units is correct and that there are no
faults.

It is more complex than unit testing, and sometimes you also need to have some configuration.
For example if you test that after some „add“ button click, your list will have one item more.
These tests are usually done by the code authors as well.

**System testing**

This kind of testing goes after implementation and in our domain it is tested in a browser.

You run the application and check how it is behaving.
For example, you open application and click button that should open modal, and modal should
have some different button that should do something else and so on.
This part can be automatized by tests which does this for you: clicking on a UI, expecting components
to be shown with correct data, typing in fields etc.
This type of tests can be done by other testers.

You can come across system testing being similar with end to end testing (often written as e2e).
We will give one point of view since this is quite debatable.
Let's say we have application that has list of items on homepage and next to each item there is add
to cart action.
After adding at least 1 item, going to cart is available.
In the cart there is summary of selected items and action to purchase it which goes to payment
service and after payment is done it should return to home page.
System testing will test if we can add items, go to cart, go to purchase and go back.
End to end testing will be testing same as system testing, but additionally, our balance should be
lowered for correct amount, and correct amount should be added to seller, correct items should be
ordered and so on.
So like a real world application usage.
As you can already see, end to end testing is really difficult to do with automatic tests.
This kind of tests is usually done by QA people, since it might require a separate database and backend from staging/development one.

Above list of testing types can be also called functional and there are more than these types.
There are also non-functional testing types, like:

- Performance testing
- Stress testing
- Security testing
- Localization testing
- Acceptance testing
- And more...

Remember, what and how should software be tested and by whom depends on your organization, company or team.
For example, Quality Assurance team might do one set of tests instead of you.
Or maybe you will do all by yourself.

### How to literally write tests?

The approach varies based on your development stack.

React developers employ different tools compared to Angular or Vue developers. Similarly, Wordpress developers have their own set of testing utilities.

However, what remains consistent across these stacks is the practice of coding for tests. Here's an example:

```Javascript
// isOddNumber is your function

test('isOddNumber returns true for value 35', () => {
  expect(isOddNumber(35))
    .toEqual(true);
});
```

The specifics of utilizing tools within each stack should be covered within their respective documentation.

### TDD

We need to note that we will simplify TDD concept since it cannot be explained in single page.

_So what is TDD?_

TDD or _Test Driven Development_ is a technique of writing tests before code in a way that you write simple failing test and as smallest code possible to pass that test. After that you write another simple failing test and another smallest code to pass this second one. You continue to do that until you are finished with code and refactor in the middle.

Sounds confusing, but it is not. Let's see an example.

We will not write code, just explain what is happening. Let's say we want to develop calculator function that allows addition, subtraction, multiplication, and division. calculator function should take 3 arguments: two numbers and operation type. And it needs to be bulletproof and check for all invalid usage.

We will use TDD and start with simple failing test:

> calculator should throw error if called empty

Why is this test failing? Since we didn't write code to fulfill that test statement yet. We write some code to throw error if calculator called empty. Test passes.

Next simple failing test will be:

> calculator should throw error if called with less or more than 3 arguments

We could also have negation like: calculator should not throw error if there is exactly 3 arguments. Try to avoid negations since they can add confusion to code. Using clean code principles here. And negativity is not good.

Back to test statement. We write code to throw error if there is 0, 1, 2, 4, or more arguments. Test passes.

We see an opportunity to refactor both in code and test. There is a check for empty and for exactly three arguments. We can leave them both, or remove empty check since it is covered by this second test.

Let's remove the empty check to clean code. Next, we need to check if the first and second arguments are numbers, and the last one is a string.

> calculator should throw error if invalid types passed for arguments

We write code to check for types. Test passes.

Then

> calculator should throw error if operation type is invalid

We test that the string is the correct value which can be 'ADD', 'SUBTRACT', and so on - whatever our interface will provide. Code will be added and test passes.

Then there is that HUGE check if dividing with 0.

> calculator should not have 0 for 2nd number with 'DIV' operation type

Code for that and test passes.

You might be yelling _"Where is calculation implementation!"_. We go step by step and here we first assure that usage is correct, and then functionality should be added.

Can you see how these checks are describing usage similar to your requirements? This is very important. Imagine someone goes to your tests first. They can know what your code does, if we assume that tests pass, without going to source. This is something that is making tests cost-effective. If someone needs to know functionality or refactor, it will be easy to do. We can add a few more tests and continue to talk about TDD.

Test for:

> calculator should return 4 if 1 and 3 are passed for 'ADD' operation type

Write code. Test passes.

> calculator should return -4 if -1 and -3 are passed for 'ADD' operation type

Again. Write code. Test passes. And so on.

Many developers find TDD annoying, not useful or time-consuming. This only means they do not see its full potential. TDD is an excellent technique for catching bugs in the start. There are some rules which you have to follow.

Most popular rules are:

- You are not allowed to write any production code unless it is to make a failing unit test pass. This means you must not write code before test.
- You are not allowed to write any more of a unit test than is sufficient to fail; and compilation failures are failures. This means you must write test as small as possible and failing one.
- You are not allowed to write any more production code than is sufficient to pass the one failing unit test. This means you must not write more code than needed to pass the test.

Every TDD should stick to these rules.

With these rules, there is also something called RED-GREEN-REFACTOR phases.

Red means you write a failing test. Imagine this as a request to add new functionality by your user. You do not have implementation at the moment, just criteria for what should it be. You should not think about implementation here. Just, how it should be used, at the moment, not later. Let's get back to the calculator function and the second test. Skipping the first since we removed it. This test is checking if we have 3 arguments. Here, we might consider a few options like maybe:

- having 2 arguments - array of numbers, and operation type like `[2, 3, 5], 'ADD'` so we can, for example, add multiple numbers and not just two
- having also 2 arguments - array of arrays where each array is `[[2, 3, 'ADD'], [7, 6, 'SUBTRACT']]` and operation type to calculate them all
- or something else.

Concentrate on current work, and not something in the future.

Green phase is where you finally can make implementation and make your test passing - green. And it is a test not tests since you should at this moment concentrate on a new one and not old tests. Write directly to pass it. Don't bother with duplication or ugly code. This can be refactored, and guess what, your tests will tell you if you refactored correctly.

And finally, the refactor phase (also known as the yellow phase) where you remove code duplication, clean a bit, make variable names better and so on. One change, one execution of all tests. If something fails, go back to where you have been before. It is easy with IDEs and Undo action.

And then you repeat all steps for a new test.

This is as we said a simplified version of TDD. TDD sounds easy but is hard to master and requires a lot of practice. TDD does not mean only unit testing, but it is mostly used for that.

Unit tests are okay, but not sufficient to be sure that the software is working properly so you also need to test it with different types of testing.

Remember, _Test it before you waste it_, and we mean code.

### Team Player

When working on a project as a team, you decide on:

- how your code will be structured,
- which tools should be used in development,
- what your and general best practices are,
- and so on...

It is no different when making these decisions (and more) for application testing.

There are some "laws" created by the community and us which need to be followed, but the rest is up to you and your team. The main point is that everyone is on the same page after the decisions are made.

#### "Laws"

![Testing](/img/testing.jpg)

1. Any testing is better than no testing.
2. Do not test 3rd party code (including yours in a different project - like in a library).
3. Tests are also code, so make them clean.
4. Pre-commit test execution is a must.
5. Testing is for you to sleep well, not your client.
6. No one is perfect at writing tests; just practice.
   Here are some links that might help you with your front end troubles.

## External links

- [MDN](https://developer.mozilla.org/en-US/)
- [SASS reference](http://sass-lang.com/documentation/file.SASS_REFERENCE.html)
- [Susy documentation](http://susydocs.oddbird.net/en/latest/)
- [Tips and Tricks for DevTools](https://developer.chrome.com/devtools/docs/tips-and-tricks)
- [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/)
- [Eloquent JavaScript](http://eloquentjavascript.net/)
- [Can I use](http://caniuse.com/)
- [MobX](https://mobx.js.org/)
- [React](https://reactjs.org/)
- [Webpack](https://webpack.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [CodeSandbox](http://codesandbox.io/)
- [FrontendCookies](https://infinum.com/frontend-cookies) weekly newsletter
- [Infinum on npmjs](https://www.npmjs.com/~infinumco)

## Useful libs

### General

- [Polyglot](https://www.npmjs.com/package/polyglot-cli)
- [Action Chainer](https://www.npmjs.com/package/action-chainer)
- [fetch polyfill](https://github.com/github/fetch)
- [jest](https://facebook.github.io/jest/)
- [husky](https://github.com/typicode/husky)
- [loglevel](https://github.com/pimterry/loglevel)

### Dates

- [date-fns](https://date-fns.org/)

### Linters

- [eslint](https://www.npmjs.com/package/@infinumjs/eslint-config)
- [eslint react](https://www.npmjs.com/package/@infinumjs/eslint-config-react)
- [stylelint](https://www.npmjs.com/package/@infinumjs/stylelint-config)

### Styles

- [Media mixin](https://github.com/infinum/media-blender)
- [emotion](https://github.com/emotion-js/emotion)
- [classnames](https://github.com/JedWatson/classnames)

### React

- [Vite](https://vite.dev/)
- [react-router](https://github.com/ReactTraining/react-router)
- [next.js](https://github.com/zeit/next.js)
- [enzyme](https://github.com/airbnb/enzyme)
- [storybook](https://github.com/storybooks/storybook)
- [Material UI](https://github.com/mui-org/material-ui/tree/master)
- [Nuka Carousel](https://github.com/FormidableLabs/nuka-carousel)

### MobX

- [mobx](https://github.com/mobxjs/mobx)
- [mobx-react](https://github.com/mobxjs/mobx-react)
- [datx](https://www.npmjs.com/package/datx)

### Angular

- [ngx-form-object](https://www.npmjs.com/package/ngx-form-object)
