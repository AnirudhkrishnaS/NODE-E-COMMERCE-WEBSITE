var express = require('express');
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
var router = express.Router();

const veryfyLogin = (req , res , next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  var user = req.session.user
  // console.log(user);

  let cartCount = null;
  if(req.session.user){
 cartCount = await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount});
  })
});


router.get('/login' , (req , res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login' , {"loginErr" : req.session.loginErr})
    req.session.loginErr = false
  }

})

router.get('/signup'  , (req , res)=>{
res.render('user/signup')
})

router.post('/signup' , (req , res)=>{
  userHelpers.doSignup(req.body).then((responce)=>{
    // console.log(responce);
    req.session.loggedIn = true
    req.session.user = responce
    res.redirect('/')
  })
})

router.post('/login' , (req , res)=>{
  userHelpers.doLogin(req.body).then((responce)=>{
    if(responce.status){
      req.session.loggedIn = true
      req.session.user = responce.user
      res.redirect('/')
    }else{
      req.session.loginErr = true
      res.redirect('/login')
    }

  })
})

//-------------logout---------//

router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart' ,veryfyLogin ,async (req , res)=>{
  let products = await userHelpers.getCartProducts(req.session.user._id)
  // console.log(products);
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  // console.log(totalValue);
 
  

  if(products.length === 0 ){
    res.render('user/cart-empty')
  }else{
    res.render('user/cart',{products , user:req.session.user , totalValue})

  }

})

router.get('/add-to-cart/:id',(req,res)=>{
  // console.log("api call");
  userHelpers.addToCart(req.params.id , req.session.user._id).then(()=>{
    res.json({status:true})
    // res.redirect('/')
  })

})
router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then( async (response)=>{
  response.total = await userHelpers.getTotalAmount(req.body.user)
    res.json(response)

  })
})


router.post('/delete-product-quantity',(req,res)=>{
  userHelpers.deleteProductQuantity(req.body).then((response)=>{
    res.json(response)
  })
})


router.get('/place-order',veryfyLogin,async (req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order' ,  {total , user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  // console.log(totalPrice);
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    // console.log(orderId);
    if(req.body['payment-method'] === 'COD'){
    // res.redirect('/order-success')
   
    res.json({codSuccess:true})

    }else{
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)

      })
    }
  })
  // console.log(req.body);
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/orders' ,async (req,res)=>{
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders' , {user:req.session.user  , orders})
})

router.get('/view-order-products/:id' , async (req,res)=>{
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products' , {user:req.session.user,products})
})


router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("Payment successfull");
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})


module.exports = router;
