
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('playgame', { name: req.params.user });
};

exports.playgame = function(req, res){
  res.render('gamepage', { name: req.params.user });
};