<div>
		<property name="forum" type="y"/>  <property name="forum" href="y" noIcon="y"/> <text text="was modified"/> 
		<br/><br/>
		<where value="modification != null">
		  <text text="Changes below made by" />: <property name="sender.firstName" href="y" /> <property name="sender.lastName" href="y" />
		</where>
    <br/>
		<property name="modification.newValues" noIcon="y"/>
    <br/>
    <where value="modification == null">
      <br/>
  		  <property name="description" noIcon="y"/>
      <br/>
		</where>
</div>