var express = require('express');
var productHelpers = require('../helpers/product-helpers')
var router = express.Router();
var fs = require('fs')

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    // console.log(products);
    res.render('admin/view-products', { admin: true, products });

  })

});
router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })

})

router.post('/add-product', (req, res) => {
  // console.log(req.body)
  // console.log(req.files.Image);
  productHelpers.addProduct(req.body, (id) => {
    // console.log(id);
    // if(req.files.Image){
    //   let imgErr = true
      // res.render('admin/v' , {imgErr})
      res.redirect('/admin/')
        
    // }
  
    let image = req.files.Image
    // console.log(image);
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product', { admin: false })
      } else {
        console.log(err);
      }

    })
  

  })

})

router.get('/delete-product/:id', (req, res) => {
  let proId = req.params.id
  // console.log(proId);
  productHelpers.deleteProduct(proId).then((responce) => {
    res.redirect('/admin/')
    fs.unlink('./public/product-images/' + proId + '.jpg',function(err){
      if(err) return console.log(err);
      console.log('file deleted successfully');
 });  

  })
})


router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  // console.log(product);
  res.render('admin/edit-product', { product })
})


router.post('/edit-product/:id', (req, res) => {
  var id = req.params.id
  // console.log(id);
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin")
    if (req.files.Image) {
      let image = req.files.Image
      // console.log(image);
      image.mv('./public/product-images/'+id+'.jpg')
    }else{
      res.redirect('/admin')
    }
  })

})


module.exports = router;
