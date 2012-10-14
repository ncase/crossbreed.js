Crossbreed.js - Multiple Inheritance in Javascript
===

Given Javascript (ES5) doesn't even have *classical* inheritance, how greedy I must be to want *multiple* inheritance. 

At just over 100 lines of code, this featherweight JS library can do just that.

---

### Creating a Class

First, create a Class by passing in a name and properties. 
If provided, the "initialize" method will be called as a constructor.

	Class.create( "Pony", {

		name: "My Name",
		info: "I'm a pony",

		initialize: function(name){
			this.name = name;
		},
		addInfo: function(info){
			this.info += " "+info;
		},
		speak: function(){
			alert(this.name+" speaking, "+this.info);
		}

	});

	var Applejack = new Pony("Applejack"); 
	Applejack.speak(); // Applejack speaking, I'm a pony

### Single Inheritance

To extend from a Class, include an "is" property with the name of the parent Class.
Calling this.super() within a function will invoke the parent Class's method of the same name.

	Class.create( "Unicorn", {
		is: "Pony",
		initialize: function(name){
			this.super(name);
			this.addInfo("who's magical");
		}
	});

	var Rarity = new Unicorn("Rarity"); 
	Rarity.speak(); // Rarity speaking, I'm a pony who's magical

	Class.create( "Pegasus", {
		is: "Pony",
		initialize: function(name){
			this.super(name);
			this.addInfo("who can fly");
		}
	});

	var Fluttershy = new Pegasus("Fluttershy");
	Fluttershy.speak(); // Fluttershy speaking, I'm a pony who can fly

### Multiple Inheritance

Now the juicy part... To extend from multiple Classes, include an Array of parent Class names.
Invoking this.super[ParentClass] will call that parent Class's method.

	Class.create( "Alicorn", {
		is: ["Unicorn", "Pegasus"],
		initialize: function(name){
			this.super.Unicorn(name);
			this.addInfo("AND");
			this.super.Pegasus(name);
		}
	});

	var Celestia = new Alicorn("Celestia");
	Celestia.speak(); // Celestia speaking, I'm a pony who's magical AND who can fly

That's all the practical usage I'll ever need.

