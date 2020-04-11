function deepClone(object) {
  let mapObj = new WeakMap()
  function getType(obj) {
    return Object.prototype.toString.call(obj).match(/\[object ([^\]]*)\]/)[1].toLowerCase()
  }
  function _clone(obj) {
    if (!obj || typeof obj !== 'object') return obj
    let res = {}
    let type = getType(obj)
    if (mapObj.has(obj)) {
      return mapObj.get(obj)
    }
    switch (type) {
      case 'array':
        res = []
        mapObj.set(obj, res)
        for (let i = 0, l = obj.length; i < l; i++) {
          res[i] = _clone(obj[i])
        }
        break
      case 'object':
        res = Object.create(Object.getPrototypeOf(obj))
        mapObj.set(obj, res)
        Object.getOwnPropertyNames(obj)
          .forEach(key => {
            res[key] = _clone(obj[key])
          })
        break
      case 'regexp':
        res = new RegExp(obj)
        break
      case 'date':
        console.log('date', obj)
        res = new Date(obj)
        break
      case 'function':
        mapObj.set(obj, res)
        res = function _cloneFn() {
          let args = [...arguments]
          obj.apply(this, args)
        }
        res.prototype = obj.prototype
        break
    }
    return res
  }
  return _clone(object)
}

function Animal(type) {
  this.type = type
}

// 简单继承
Animal.prototype = {
  constructor: Animal,
  sayHello() {
    console.log(`Hello I'm a ${this.type}`)
  }
}
function Dog(name) {
  Animal.call(this, 'dog')
  this.name = name
}
function Temp() {}
Temp.prototype = Animal.prototype
Dog.prototype = new Temp()
Dog.prototype.constructor = Dog
Dog.prototype.bark = function bark() {
  console.log(`汪汪，我是一只小狗，名叫${this.name}`)
}


let name = {
  first: 'Alander',
  last: 'Lin'
}

let person = {
  name,
  friends: [
    {
      name: 'Peter',
      age: 24
    }
  ],
  pet: new Dog('dog1'),
  OwnDog: Dog,
  birthday: new Date('1997-11-28'),
  valid: /lin/
}

person.friends.push(person)

let _person = deepClone(person)
console.log(_person)
console.log(_person.birthday.toDateString())
console.log(_person.pet === person.pet)

_person.pet.bark()
_person.pet.sayHello()

let _dog = new _person.OwnDog('dog2')
_dog.bark()
_dog.sayHello()
