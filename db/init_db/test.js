function resolveAfter10Seconds() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('in promise');
//resolve([10, 5]);
    }, 3000);
  });
}

function resolveAfter5Seconds(x) {
  return new Promise((resolve) => {
    setTimeout(() => {
console.log('in second');
      resolve('any');
    }, 5000);
  });
}

async function f1() {
  const x = await resolveAfter10Seconds();
  console.log('after x');
  const y = await resolveAfter5Seconds(5);
    console.log('first');
  console.log(x); 
  console.log(y);
  console.log('second');
}

f1();
console.log('after');

