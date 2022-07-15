export const MGT2 = {};

// Define constants here, such as:
MGT2.foobar = {
  'bas': 'MGT2.bas',
  'bar': 'MGT2.bar'
};

MGT2.DEAD = 0;
MGT2.UNCONSCIOUS = 1;
MGT2.HURT = 2;
MGT2.OKAY = 3;

MGT2.getStatus = function(actor) {

  const data = actor.data.data;
  console.log(data);

};