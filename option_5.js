(function () {
   
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase
        .auth()
        .signInWithEmailAndPassword(_femail, _fpass)
        .then((userCredential) => {
            var user = userCredential.user;
            window.user = user;
            console.log(user);
        })
        .catch((error) => {
            console.log(error);
        });
    var db = firebase.firestore();
    var persons = db.collection("persons");
    var app = new Vue({
        el: "#app",
        data: {
            msg: "Hello Vue Wizard",
            current_step: 1, // do not remove
            total_step: 0, // do not remove
            // Add your code below here
            is_valid: true,
            membership_no: null,
            member: {
                id: null,
                status: null,
                product: null,
                plan: null,
                expires_date: null,
                other_name: null,
                surname: null,
            },
        },
        components: {
            Panel: panel(), // do not remove
        },
        watch: {},
        methods: {
            // step_finish will execute as the last step next function
            // do not remove
            step_finish: function () {
                console.log("Last step");
                this.current_step = 1;
                app.data_reset();
            },

            data_reset: function () {},
            // Add your code below here
            say: function () {
                console.log("say awasome");
                return true;
            },

            plan_type: function () {},
            plan_tenor: function () {},
            verify: async function () {
                // check user
                this.is_valid = true;
                if (this.membership_no != null) {
                    var doc = await persons
                        .where("pin", "==", this.membership_no)
                        .limit(1)
                        .get();
                    if (!doc.empty) {
                        this.member = doc.docs[0].data();
                        this.is_valid = true;
                        return true;
                    } else {
                        this.is_valid = false;
                        return false;
                    }
                } else {
                    this.is_valid = false;
                }
            },
        },
    });
    // Panel Component
    function panel() {
        // Panel Component
        var panel = {
            props: ["step", "title", "action", "bnext", "dnext"],
            template: `<div :data-step="step" v-if="$parent.current_step==step" class="vue-panel card">     
        <div class="card-body">
            <div v-if="title">
                <h5 class="text-center">{{title}}</h5>
                <hr>
            </div>
            <div><slot></slot></div>
            <hr>
            <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-secondary mr-1" v-if="isBack" v-on:click="back">Back</button>
                <button :disabled="dnext" type="button" class="btn btn-primary" v-on:click="next">{{next_text}}</button>
            </div>
        </div>      
      </div>`,
            data: function () {
                return {
                    isBack: this.step == 1 ? false : true,
                    next_text: this.bnext ? this.bnext : "Next",
                    dnext: this.dnext ? this.dnext : false,
                };
            },
            methods: {
                next: async function () {
                    if (this.action) {
                        if (await this.$parent[this.action]()) {
                            if (
                                this.$parent.current_step ==
                                this.$parent.total_step
                            ) {
                                this.$parent.step_finish();
                            } else {
                                this.$parent.current_step++;
                            }
                        }
                    } else {
                        if (
                            this.$parent.current_step == this.$parent.total_step
                        ) {
                            this.$parent.step_finish();
                        } else {
                            this.$parent.current_step++;
                        }
                    }
                    console.log(this.$parent.total_step);
                },
                back: function () {
                    this.$parent.current_step--;
                },
            },
            created: function () {
                this.$parent.total_step += 1;
                console.log("Panel Created");
            },
        };
        return panel;
    }
    // End Panel Component
})();
